import * as fs from 'fs-extra';
import { Server, ServerRoute } from 'hapi';
import * as path from 'path';

export function singlePageApp(server: Server): ServerRoute {
    return {
        method: 'GET',
        path: '/{path*}',
        handler: (req, h) => {
            const expectsHtml = req.headers.accept && req.headers.accept.startsWith('text/html');

            // Treat this as a request for a specific file if an extension is
            // provided
            const pathSegments = req.params.path.split('/');
            const fileRequest = pathSegments[pathSegments.length - 1].indexOf('.') > 0;

            // Allow `curl localhost:3000` to return HTML
            const isRoot = req.params.path === '';

            if ((expectsHtml && !fileRequest) || isRoot) {
                return h.file('index.html');
            }

            const send404 = () => h.response('404 Not Found').code(404);

            const file = path.resolve(server.settings.routes!!.files!!.relativeTo, req.params.path);
            return fs.stat(file).then((stats) => {
                if (stats.isFile())
                    return h.file(req.params.path);
                else
                    return send404();
            }).catch(() => {
                return send404();
            });
        }
    };
}
