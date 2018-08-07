import * as crypto from 'crypto';
import { Db, GridFSBucket, ObjectID } from 'mongodb';
import { ReadableStreamBuffer, WritableStreamBuffer } from 'stream-buffers';
import { Storage } from './storage';

export class GridFsStorage extends Storage<'gridfs'> {
    public get type(): 'gridfs' { return 'gridfs'; }

    private bucket: GridFSBucket;

    public constructor(db: Db) {
        super();
        this.bucket = new GridFSBucket(db);
    }

    public read(id: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const writableStream = new WritableStreamBuffer();
            const downloadStream = this.bucket.openDownloadStream(new ObjectID(id));

            downloadStream
                .on('error', reject)
                .pipe(writableStream)
                .on('finish', () => resolve(writableStream.getContents()));
        });
    }

    public async exists(id: string): Promise<boolean> {
        const results = await this.bucket
            .find({ _id: new ObjectID(id) })
            .limit(1)
            .toArray();
        
        return results.length > 0;
    }

    public async list(): Promise<string[]> {
        const docs = await this.bucket
            .find()
            .project({ _id: true })
            .toArray();

        return docs.map((d) => d._id.toHexString());
    }

    public async delete(uploadId: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.bucket.delete(new ObjectID(uploadId), (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    protected doUpload(data: Buffer): Promise<string> {
        return new Promise((resolve, reject) => {
            // Generate a random file name
            const filename = crypto.randomBytes(5).toString('hex');

            const stream = new ReadableStreamBuffer();
            const uploadStream = this.bucket.openUploadStream(filename);

            stream
                .pipe(uploadStream)
                .on('error', reject)
                .on('finish', () => resolve(uploadStream.id.toString()));
            stream.put(data);
            stream.stop();
        });
    }
}
