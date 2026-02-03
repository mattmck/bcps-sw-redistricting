# Enable Branch Protection for PR Build Checks

## What Was Added

✅ **GitHub Actions CI Workflow** (`.github/workflows/ci.yml`)
- Runs on every PR to master/main
- Uses Node.js 22.20.0 (project requires 18+)
- Performs TypeScript type checking
- Builds the project with Vite
- Verifies successful dist output
- Injects Mapbox API key from GitHub Secrets

## Enable Required Checks (Next Steps)

To require this check before merging PRs:

### Via GitHub Web UI:

1. Go to: https://github.com/mattmck/bcps-sw-redistricting/settings/branches
2. Click **Add rule** (or edit existing rule for `master`)
3. Branch name pattern: `master`
4. Enable these settings:
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - Search for and select: `build`
5. Optional but recommended:
   - ✅ **Require a pull request before merging**
   - ✅ **Require approvals** (if you have collaborators)
6. Click **Create** or **Save changes**

### Via GitHub CLI (if you prefer):

```bash
# Enable branch protection with required checks
gh api repos/mattmck/bcps-sw-redistricting/branches/master/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=build \
  --field required_pull_request_reviews[required_approving_review_count]=0 \
  --field enforce_admins=false \
  --field restrictions=null
```

## How It Works

1. **On PR Creation/Update**: The workflow triggers automatically
2. **Environment Setup**: Node.js 22.20.0 with npm cache
3. **Type Safety**: Runs `tsc --noEmit` to catch type errors
4. **Build Verification**: Runs `npm run build` with Mapbox API key
5. **Output Check**: Verifies dist/ directory was created
6. **Merge Blocking**: If any check fails, the "Merge" button is disabled

## Testing the Workflow

The workflow will run on your current PR! Check:
- https://github.com/mattmck/bcps-sw-redistricting/actions

You should see the CI workflow running now that it's been pushed.

## Benefits

✅ Prevents broken code from being merged  
✅ Ensures TypeScript type safety  
✅ Verifies builds work on Node 22 (compatible with 18+ requirement)  
✅ Tests Mapbox integration with production token  
✅ Automatic - no manual checks needed  
✅ Clear feedback in PR status checks
