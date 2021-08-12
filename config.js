
if(!process.env.VUE_APP_DOCHUB_GITLAB_URL)
    throw 'Not specified the URL of the GitLab (VUE_APP_DOCHUB_GITLAB_URL)';

if(!process.env.VUE_APP_DOCHUB_MANIFEST_PROJECT_ID)
    throw 'Not specified the root project ID (VUE_APP_DOCHUB_MANIFEST_PROJECT_ID)';

if(!process.env.VUE_APP_DOCHUB_MANOFEST_PROJECT_BRANCH)
    throw 'Not specified the branch of root project (VUE_APP_DOCHUB_MANOFEST_PROJECT_BRANCH)';

if(!process.env.VUE_APP_DOCHUB_APP_ID)
    throw 'Not specified the application ID at GitLab (VUE_APP_DOCHUB_APP_ID)';

if(!process.env.VUE_APP_DOCHUB_CLIENT_SECRET)
    throw 'Not specified the application secret at GitLab (VUE_APP_DOCHUB_CLIENT_SECRET)';

export default {
    "gitlab_server": process.env.VUE_APP_DOCHUB_GITLAB_URL,
    "root_manifest" : {
        "project_id": process.env.VUE_APP_DOCHUB_MANIFEST_PROJECT_ID,
        "branch": process.env.VUE_APP_DOCHUB_MANOFEST_PROJECT_BRANCH
    },
    "oauth" : {
        "APP_ID": process.env.VUE_APP_DOCHUB_APP_ID,
        "CLIENT_SECRET": process.env.VUE_APP_DOCHUB_CLIENT_SECRET,
        "REQUESTED_SCOPES": "read_repository+api"
    }
}
