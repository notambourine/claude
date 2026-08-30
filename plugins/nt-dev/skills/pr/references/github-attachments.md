# GitHub attachments

Capture stable viewport; relevant state only; no secrets or unrelated chrome.

```bash
FILE=shot.png
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
URL=$(curl -s -X POST \
  "https://uploads.github.com/user-attachments/assets?name=$(basename "$FILE")&content_type=image/png&repository_id=$(gh api "repos/$REPO" --jq .id)" \
  -H "Authorization: Bearer $(gh auth token)" \
  -H "Accept: application/json" \
  --data-binary "@$FILE" | jq -r .url)
```

Embed: `![label]($URL)`.

Undocumented endpoint failure (`404`/`422`):

```bash
gh release create pr-<n>-shots --prerelease "$FILE"
```

Embed asset URL; delete prerelease after merge.
