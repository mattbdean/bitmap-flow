import { Media, MediaFilters, PaginatedData } from '@bitmap-flow/shared/lib/api';
import * as crypto from 'crypto';
import { sortBy } from 'lodash';
import { Collection, ObjectID } from 'mongodb';
import { MediaHelper } from '../media-helper';
import { Storage } from '../storage/storage';

export class MediaDao {
    public static readonly DEFAULT_LIMIT = 25;

    private mediaHelper = new MediaHelper();

    public constructor(private coll: Collection) {}

    public async byId(id: string): Promise<Media | null> {
        return this.coll.findOne({ _id: new ObjectID(id) });
    }

    public async upload(opts: {
        data: Buffer,
        storage: Storage<any>,
        tags: string[],
        source: string | null
    }): Promise<Media> {
        const { data, storage, tags, source } = opts;
        const meta = await this.mediaHelper.signature(data);

        // TODO(mattbdean): compress and check for duplicates if image

        const summary = await storage.upload(data);

        const hash = await this.checksum(data);

        const media: Media = {
            filename: summary.id + '.' + meta.extension,
            hash,
            tags,
            source,
            // TODO
            fromUrl: null,
            type: meta.type,
            extension: meta.extension,
            format: meta.format,
            upload: summary,
            uploadedAt: new Date()
        };
        const insertResult = await this.coll.insertOne(media);
        return insertResult.ops[0];
    }

    public async list(opts: {
        page?: number,
        limit?: number,
    } & MediaFilters = {}): Promise<PaginatedData<Media>> {
        const page = opts.page !== undefined ? opts.page : 1;
        const limit = opts.limit !== undefined ? opts.limit : MediaDao.DEFAULT_LIMIT;

        if (page <= 0)
            throw new Error('page <= 0');
        if (limit < 0)
            throw new Error('limit <= 0');

        const media = await this.coll.find(MediaDao.createQuery(opts))
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();
        
        return {
            data: media,
            total: await this.count(opts)
        };
    }

    public async count(filters: MediaFilters = {}): Promise<number> {
        // TODO(mattbdean) Could become slow when dealing with a lot of images
        return this.coll.countDocuments(MediaDao.createQuery(filters), undefined);
    }

    public async tags(): Promise<string[]> {
        return sortBy(await this.coll.distinct('tags', {}), (tag) => tag.toLowerCase());
    }

    public async sources(): Promise<string[]> {
        const sources = (await this.coll.distinct('source', {}))
            .filter((s: string) => s !== null);
        return sortBy(sources, (s) => s.toLowerCase());
    }

    public async identifyMissing(storage: Storage<any>): Promise<ObjectID[]> {
        const documents: Media[] = await this.coll.find({ 'upload.type': storage.type }).toArray();
        const missing: ObjectID[] = [];

        for (const media of documents) {
            const id = media.upload.id;
            if (!await storage.exists(id))
                missing.push(media._id!! as any);
        }

        return missing;
    }

    public async cleanMissing(ids: ObjectID[]) {
        return (await this.coll.deleteMany({ _id: { $in: ids }})).deletedCount;
    }

    // TODO(mattbdean) Handle multiple Storage objects
    public async identifyExtra(storage: Storage<any>): Promise<string[]> {
        const ids = await storage.list();
        const matched: Array<Partial<Media>> = await this.coll
            .find({ 'upload.id': { $in: ids } })
            .project({ _id: true, upload: true })
            .toArray();

        const extras: string[] = [];
        for (const id of ids) {
            if (matched.find((media) => media.upload!!.id === id) === undefined)
                extras.push(id);
        }

        return extras;
    }

    private async checksum(data: Buffer): Promise<string> {
        // TODO(mattbdean) not very "async-y", could quickly become a bottleneck
        // for large files
        const hash = crypto.createHash('sha256');
        hash.update(data);
        return hash.digest('hex');
    }

    private static createQuery(filters?: MediaFilters) {
        if (filters === undefined)
            return {};

        const query: any = {};

        if (filters.tags && filters.tags.length > 0)
            query.tags = { $all: filters.tags };

        if (filters.source)
            query.source = filters.source;

        return query;
    }
}
