import { UploadSummary } from '@bitmap-flow/shared/lib/api';
import * as _ from 'lodash';

export abstract class Storage<T extends string> {
    public abstract get type(): T;

    /**
     * Uploads some media.
     */
    public async upload(data: Buffer): Promise<UploadSummary<T>> {
        const id = await this.doUpload(data);
        return {
            type: this.type,
            id
        };
    }

    /**
     * Fetches the data for some media with the given ID, or rejects if there
     * is no such media with that ID
     */
    public abstract read(id: string): Promise<Buffer>;

    /**
     * Tests if there is a file associated with the provided media ID
     */
    public abstract exists(id: string): Promise<boolean>;

    /** Returns upload IDs of all stored media */
    public abstract list(): Promise<string[]>;

    /** Deletes some media whose upload ID is given */
    public abstract delete(uploadId: string): Promise<void>;

    /**
     * Uploads some media and returns its ID
     */
    protected abstract doUpload(data: Buffer): Promise<string>;
}
