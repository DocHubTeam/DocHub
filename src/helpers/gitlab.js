import config from "../config";

export default {
    parseHashParams(hash) {
        let hashParams = {};
        let a = /\+/g,  // Regex for replacing addition symbol with a space
            r = /([^&;=]+)=?([^&;]*)/g,
            d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
            e = r.exec(hash);

        if (e) {
            hashParams[d(e[1])] = d(e[2]);
        }

        return hashParams;
    },

    parseURI(uri) {
        let url = new URL(uri);
        return {
            branch: url.searchParams.get('ref'),
            project: 1 * url.pathname.split('/')[4],
            file: decodeURIComponent(
                url.pathname.split('/repository/files/')[1].replace('/raw', '')
            )
        };
    },

    isGitLabURI(uri) {
        let gitlab_server = new URL(config.gitlab_server);
        let uri_server = new URL(uri);
        return gitlab_server.hostname === uri_server.hostname
    },

    projectsListURI(page) {
        return new URL(`/api/v4/projects?simple=1&page=${page}`, config.gitlab_server);
    },

    projectSingleURI(id) {
        return new URL(`/api/v4/projects/${id}?simple=1`, config.gitlab_server);
    },

    branchesListURI(project, page) {
        return new URL(`/api/v4/projects/${project}/repository/branches?pagination=keyset&per_page=100&order_by=name&page=${page}`,
            config.gitlab_server);
    },

    commitsListURI(project, branch, page, file, page_limit) {
        return new URL(
            `/api/v4/projects/${project}/repository/commits?pagination=keyset`
            + `&per_page=` + (page_limit ? page_limit : 100) + `&order_by=name&page=${page}&ref_name=${branch}`
            + (file ? `&path=` + encodeURIComponent(file) : '')
            , config.gitlab_server);
    },

    makeFileURI(app_id, source, branch, view_type) {
        return new URL(
            `/api/v4/projects/${app_id}/repository/files/`
            + encodeURIComponent(source)
            + (view_type ? `/${view_type}` : '')
            + (branch ? `?ref=${branch}` : '')
            , config.gitlab_server
        );
    },
};
