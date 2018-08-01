import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';
import { UploadSummary } from '../../../shared/lib/api/upload-summary';
import { Storage } from './storage';

export class FsStorage extends Storage<'fs'> {
    public constructor(private readonly baseDir: string) {
        super();
    }

    public get type(): 'fs' { return 'fs'; }

    public async upload(data: Buffer): Promise<UploadSummary<'fs'>> {
        const id = crypto.randomBytes(5).toString('hex');

        await fs.mkdirp(this.baseDir);

        await fs.writeFile(this.filePath(id), data, 'binary');
        
        return {
            type: this.type,
            id
        };
    }

    public async read(id: string): Promise<Buffer> {
        // TODO(mattbdean): Validate `id` to make sure it's only alphanumeric
        return fs.readFile(this.filePath(id));
    }

    public async exists(id: string): Promise<boolean> {
        const stats = await this.safeStats(this.filePath(id));
        return stats === null ? false : stats.isFile();
    }
    
    public async list(): Promise<string[]> {
        return (await this.baseDirValid()) ? fs.readdir(this.baseDir) : [];
    }

    public delete(uploadId: string): Promise<void> {
        return fs.unlink(this.filePath(uploadId));
    }

    private async safeStats(location: string): Promise<fs.Stats | null> {
        try {
            return await fs.stat(location);
        } catch (err) {
            if (err.code && err.code === 'ENOENT')
                return null;
            throw err;
        }
    }

    private async baseDirValid(): Promise<boolean> {
        const stats = await this.safeStats(this.baseDir);
        return stats === null ? false : stats.isDirectory();
    }

    private filePath(id: string) { return path.resolve(this.baseDir, id); }
}
