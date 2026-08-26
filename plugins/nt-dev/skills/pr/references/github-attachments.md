# GitHub user attachments

Capture the relevant application state with the available browser or platform tooling. Use a stable viewport and omit unrelated chrome or sensitive data.

Upload a PNG as a GitHub user attachment:

```bash
FILE=shot.png
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
URL=$(curl -s -X POST \
  "https://uploads.github.com/user-attachments/assets?name=$(basename "$FILE")&content_type=image/png&repository_id=$(gh api "repos/$REPO" --jq .id)" \
  -H "Authorization: Bearer $(gh auth token)" \
  -H "Accept: application/json" \
  --data-binary "@$FILE" | jq -r .url)
```

Embed the result as `![descriptive label]($URL)`. The endpoint is undocumented. If it returns 404 or 422, create a prerelease with the capture and embed its asset URL:

```bash
gh release create pr-<n>-shots --prerelease "$FILE"
```

Remove the prerelease after the PR merges.
