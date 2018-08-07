import { ObjectID } from 'bson';
import * as fs from 'fs-extra';
import { Server, ServerRoute } from 'hapi';
import * as Joi from 'joi';
import * as path from 'path';
import { MediaDao } from '../db/media.dao';
import { Storage } from '../storage/storage';

export function api(dao: MediaDao, storage: Storage<any>): ServerRoute[] {
    /*
    GET /api/v1/media?page=2&limit=25
    POST /api/v1/media
      multipart with file
    POST /api/v1/media?url=https://example.com/foo.jpg
    */
    return [
        {
            method: 'GET',
            path: '/api/v1/media',
            handler: (req, h) => {
                const query = req.query as any;
                return dao.list({
                    limit: query.limit,
                    page: query.page,
                    source: query.source,
                    tags: parseCsvLine(query.tags)
                });
            },
            options: {
                validate: {
                    query: {
                        page: Joi.number().integer().min(1).default(1),
                        limit: Joi.number().integer().min(1).max(100).default(25),
                        source: Joi.string().max(100),
                        tags: Joi.string().min(0).max(1000)
                    }
                }
            }
        },
        {
            method: 'GET',
            path: '/api/v1/media/{id}',
            handler: async (req, h) => {
                const media = await dao.byId(req.params.id);
                return media === null ? h.response({ error: 'Not found' }).code(404) : media;
            },
            options: {
                validate: {
                    params: {
                        id: Joi.string().required()
                    }
                }
            }
        },
        {
            method: 'GET',
            path: '/api/v1/media/{id}/dl',
            handler: async (req, h) => {
                const media = await dao.byId(req.params.id);
                if (media === null)
                    return h.response('Not found').code(404);
                
                const data = await storage.read(media.upload.id);
                const mimeType = req.server.mime.path('a.' + media.extension).type;
                return h.response(data).header('Content-Type', mimeType);
            },
            options: {
                validate: {
                    params: {
                        id: Joi.string().required()
                    }
                }
            }
        },
        {
            method: 'POST',
            path: '/api/v1/media',
            handler: (req, h) => {
                const payload = req.payload as any;
                return dao.upload({
                    data: payload.file,
                    storage,
                    tags: parseCsvLine(payload.tags),
                    source: payload.source
                });
            },
            options: {
                payload: {
                    allow: 'multipart/form-data',
                    // 5MB max
                    maxBytes: 5 * Math.pow(2, 20)
                },
                validate: {
                    payload: {
                        file: Joi.binary().required(),
                        tags: Joi.string().min(0).max(1000),
                        source: Joi.string().default(null)
                    }
                }
            }
        },
        {
            method: 'DELETE',
            path: '/api/v1/media/{id}',
            handler: async (req, h) => {
                const media = await dao.byId(req.params.id);
                if (media === null)
                    return h.response({ error: 'Not Found' }).code(404);

                await dao.delete((media._id as ObjectID).toHexString(), storage);

                // 204 No Content
                return h.response().code(204);
            }
        },
        {
            method: 'GET',
            path: '/api/v1/media/tags',
            handler: (req, h) => dao.tags()
        },
        {
            method: 'GET',
            path: '/api/v1/media/sources',
            handler: (req, h) => dao.sources()
        }
    ];
}

function parseCsvLine(data?: string): string[] {
    if (data === undefined)
        return [];

    return data.split(',').map((el: string) => el.trim());
}

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
