import { Media, PaginatedData } from '@bitmap-flow/shared/lib/api';
import { UploadData } from './upload-data';

export class MediaApi {
    private basePath: string;

    public constructor(opts?: { basePath?: string }) {
        this.basePath = opts && opts.basePath ? opts.basePath : '/api/v1';
    }

    public list(opts: {
        limit?: number,
        page?: number,
        tags?: string[],
        source?: string
    } = {}): Promise<PaginatedData<Media>> {
        return this.get('/media', {
            limit: opts.limit,
            page: opts.page,
            tags: opts.tags && opts.tags.length > 0 ? opts.tags.join(',') : undefined,
            source: opts.source
        });
    }

    public tags(): Promise<string[]> {
        return this.get('/media/tags');
    }

    public sources(): Promise<string[]> {
        return this.get('/media/sources');
    }

    public upload(opts: UploadData): Promise<Media> {
        const form = new FormData();
        form.append('file', opts.file, opts.file.name);
        if (opts.tags && opts.tags.length > 0)
            form.append('tags', opts.tags.join(','));
        if (opts.source)
            form.append('source', opts.source);
        
        return fetch(this.path('/media'), {
            method: 'POST',
            body: form
        }).then((res) => res.json() as Promise<Media>);
    }

    private path(relPath: string) {
        return this.basePath + relPath;
    }
    
    private get<T>(relativePath: string, query?: { [key: string]: any }): Promise<T> {
        const queryString = query === undefined ? '' : '?' + Object.keys(query)
            .filter((k) => query[k] !== null && query[k] !== undefined)
            .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(String(query[k])))
            .join('&');

        return fetch(this.basePath + relativePath + queryString)
            .then((res) => res.json() as Promise<T>);
    }
}
