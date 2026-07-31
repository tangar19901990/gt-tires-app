#!/usr/bin/env python3
"""
GT Tires CRM — onboard_client.py
-----------------------------------------------------------
Автоматизує підключення нового SaaS-клієнта (модель "окрема копія
на кожного клієнта", описана в ONBOARDING.md).

Робить автоматично:
  1. Створює новий GitHub-репозиторій gt-tires-app-<slug>
  2. Копіює туди всі потрібні файли з основного репо
  3. Замінює брендинг (назва, адреса, телефон) в HTML/JS
  4. Проставляє CLIENT_SLUG у блоці перевірки ліцензії
  5. Вмикає GitHub Pages
  6. Друкує готовий SQL-запит для таблиці licenses (виконати вручну
     в Supabase проєкту gt-tires, бо це зачіпає ЧУЖУ базу — свідомо
     не роблю це автоматично)

Робить ВРУЧНУ (описано в виводі скрипта в кінці):
  - Створення нового Supabase-проєкту для клієнта (окрема, ізольована
    база — свідомо не автоматизую створення чужих платних ресурсів)
  - Заміна прайс-листа, якщо клієнт хоче свій, а не шаблон GT Tires

ВИКОРИСТАННЯ:
  export GH_TOKEN="github_pat_..."
  python3 onboard_client.py \\
    --slug sto100shyn \\
    --name "Сто100Шин" \\
    --address "Броварська, Велика Окружна дорога, 25, Київ" \\
    --phone "+380677807741" \\
    --github-user tangar19901990

Після завершення — пройтись по чек-листу "Перевірка перед передачею
клієнту" з ONBOARDING.md вручну (відкрити сайт, тестове замовлення тощо).
-----------------------------------------------------------
"""
import argparse
import base64
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error

SOURCE_REPO = "gt-tires-app"
CORE_FILES = [
    "gt-tires-v4-supabase-ready.html",
    "app.js",
    "styles.css",
    "print.js",
    "manifest.json",
    "service-worker.js",
    ".nojekyll",
]
ICON_FILES_PREFIX = "icons/"  # копіюємо все, що в icons/, окремим кроком через git tree


def gh_request(url, token, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/vnd.github+json")
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, data=body) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"  ⚠️  HTTP {e.code} на {url}: {err_body[:300]}")
        return None


def create_repo(token, github_user, repo_name):
    print(f"[1/6] Створюю репозиторій {repo_name}...")
    url = f"https://api.github.com/user/repos"
    result = gh_request(url, token, method="POST", data={
        "name": repo_name,
        "description": f"GT Tires CRM — клієнтська копія",
        "private": False,
        "auto_init": True,
    })
    if result is None:
        print("  Можливо, репозиторій вже існує — продовжую (це ок при повторному запуску).")
    else:
        print(f"  ✅ Створено: {result.get('html_url')}")
    time.sleep(2)  # дати GitHub секунду на ініціалізацію


def get_file_sha(token, owner, repo, path):
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    result = gh_request(url, token)
    return result["sha"] if result else None


def copy_file(token, github_user, repo_name, path, transform=None):
    src_url = f"https://api.github.com/repos/{github_user}/{SOURCE_REPO}/contents/{path}"
    src = gh_request(src_url, token)
    if src is None or "content" not in src or not src["content"]:
        # Великий файл (>1МБ) — Contents API обрізає, читаємо через git blob API
        tree_url = f"https://api.github.com/repos/{github_user}/{SOURCE_REPO}/git/trees/main?recursive=1"
        tree = gh_request(tree_url, token)
        blob_sha = None
        for item in tree.get("tree", []):
            if item["path"] == path:
                blob_sha = item["sha"]
                break
        if not blob_sha:
            print(f"  ⚠️  Не знайшов {path} у дереві репо, пропускаю")
            return
        blob = gh_request(f"https://api.github.com/repos/{github_user}/{SOURCE_REPO}/git/blobs/{blob_sha}", token)
        content_bytes = base64.b64decode(blob["content"])
    else:
        content_bytes = base64.b64decode(src["content"])

    if transform:
        text = content_bytes.decode("utf-8")
        text = transform(text)
        content_bytes = text.encode("utf-8")

    dst_url = f"https://api.github.com/repos/{github_user}/{repo_name}/contents/{path}"
    existing_sha = get_file_sha(token, github_user, repo_name, path)
    payload = {
        "message": f"chore: onboarding — copy {path}",
        "content": base64.b64encode(content_bytes).decode("ascii"),
    }
    if existing_sha:
        payload["sha"] = existing_sha
    result = gh_request(dst_url, token, method="PUT", data=payload)
    status = "OK" if result else "FAIL"
    print(f"  {path}: {status}")


def make_branding_transform(client_slug, business_name, address, phone):
    def transform(text):
        text = text.replace("GT Tires Service", business_name)
        text = text.replace("GT Tires", business_name)
        text = text.replace("Велика Димерка, вул. Соборна 106", address)
        text = text.replace("+380000000000", phone)  # плейсхолдер, підправ вручну якщо старий формат інший
        text = re.sub(r"CLIENT_SLUG\s*=\s*'[^']*'", f"CLIENT_SLUG='{client_slug}'", text)
        return text
    return transform


def enable_pages(token, github_user, repo_name):
    print("[5/6] Вмикаю GitHub Pages...")
    url = f"https://api.github.com/repos/{github_user}/{repo_name}/pages"
    result = gh_request(url, token, method="POST", data={"source": {"branch": "main", "path": "/"}})
    if result:
        print(f"  ✅ Pages увімкнено: https://{github_user}.github.io/{repo_name}")
    else:
        print("  ⚠️  Можливо вже увімкнено раніше — перевір вручну в Settings → Pages")


def main():
    ap = argparse.ArgumentParser(description="Онбординг нового клієнта GT Tires CRM")
    ap.add_argument("--slug", required=True, help="Короткий ідентифікатор клієнта, напр. sto100shyn")
    ap.add_argument("--name", required=True, help="Назва бізнесу клієнта")
    ap.add_argument("--address", required=True, help="Адреса клієнта")
    ap.add_argument("--phone", required=True, help="Телефон клієнта")
    ap.add_argument("--github-user", required=True, help="GitHub-акаунт (власник репо)")
    args = ap.parse_args()

    token = os.environ.get("GH_TOKEN")
    if not token:
        print("❌ Встанови змінну середовища GH_TOKEN перед запуском")
        sys.exit(1)

    repo_name = f"gt-tires-app-{args.slug}"
    print(f"\n=== Онбординг клієнта: {args.name} ({repo_name}) ===\n")

    create_repo(token, args.github_user, repo_name)

    print("[2/6] Копіюю базові файли...")
    transform = make_branding_transform(args.slug, args.name, args.address, args.phone)
    for f in CORE_FILES:
        needs_branding = f in ("gt-tires-v4-supabase-ready.html", "app.js", "print.js")
        copy_file(token, args.github_user, repo_name, f, transform=transform if needs_branding else None)

    print("[3/6] Копіюю іконки...")
    for icon in ("icons/icon-192.png", "icons/icon-512.png"):
        copy_file(token, args.github_user, repo_name, icon)

    print("[4/6] Гілка/структура готові.")
    enable_pages(token, args.github_user, repo_name)

    print("\n=== ВРУЧНУ (свідомо не автоматизовано) ===")
    print("1. Створи новий Supabase-проєкт для клієнта (окрема ізольована база)")
    print("   Застосуй структуру таблиць: v4_clients, v4_orders, v4_order_items,")
    print("   v4_products, v4_payments, v4_cash_operations, v4_settings")
    print(f"2. В адмінці нового сайту (https://{args.github_user}.github.io/{repo_name})")
    print("   в полях supaUrl / supaKey впиши дані нового Supabase-проєкту")
    print("3. Виконай у Supabase-проєкті 'gt-tires' (де живе таблиця licenses):\n")
    print(f"   insert into public.licenses (client_slug, business_name, paid_until, is_active)")
    print(f"   values ('{args.slug}', '{args.name}', '<дата оплати>', true);\n")
    print("4. Пройдись по чек-листу 'Перевірка перед передачею клієнту' з ONBOARDING.md")


if __name__ == "__main__":
    main()
