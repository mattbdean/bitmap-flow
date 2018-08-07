import { Media } from '@bitmap-flow/shared/lib/api';
import { ObjectID } from 'bson';
import { ServerRoute } from 'hapi';
import * as Joi from 'joi';
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
                const tags = parseCsvLine(payload.tags);
                return dao.upload({
                    data: payload.file,
                    storage,
                    tags: tags === undefined ? [] : tags,
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
            method: 'PATCH',
            path: '/api/v1/media/{id}',
            handler: async (req, h) => {
                const body: { source?: string, tags?: string } = req.payload as any;

                const updatedDoc: Media | null = await dao.patch(req.params.id, {
                    tags: parseCsvLine(body.tags),
                    source: body.source
                });

                if (updatedDoc)
                    return h.response(updatedDoc).code(200);
                else
                    return h.response({ error: 'Not Found' }).code(404);
            },
            options: {
                validate: {
                    payload: {
                        source: Joi.string().max(100),
                        tags: Joi.string().min(0).max(1000)
                    }
                }
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

function parseCsvLine(data?: string): string[] | undefined {
    if (data === undefined)
        return undefined;

    return data.split(',').map((el: string) => el.trim());
}
