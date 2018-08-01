import * as _ from 'lodash';
import { MediaExtension, MediaFormat, MediaType } from '../../../shared/lib/api';
import { UploadSummary } from '../../../shared/lib/api/upload-summary';
import { UploadCandidate } from './upload-candidate';

export abstract class Storage<T extends string> {
    private static readonly signatures: Signature[] = [
        // JPEG raw
        { format: 'jpeg', head: [0xFF, 0xD8, 0xFF, 0xDB] },
        // JPEG JFIF format
        { format: 'jpeg', head: [
            0xFF, 0xD8, 0xFF, 0xE0, 0x00,
            0x10, 0x4A, 0x46, 0x49, 0x46,
            0x00, 0x01
        ]},
        // JPEG Exif
        { format: 'jpeg', head: [
            0xFF, 0xD8, 0xFF,
            0xE1, null, null, 0x45, 0x78,
            0x69, 0x66, 0x00, 0x00
        ]},
        // PNG
        { format: 'png', head: [
            0x89, 0x50, 0x4E, 0x47, 0x0D,
            0x0A, 0x1A, 0x0A
        ]}
    ];

    private static readonly maxSignatureSize: number = _(Storage.signatures)
        .map((s) => s.head.length)
        .max() || 0;

    public abstract get type(): T;

    /**
     * Uploads some media.
     */
    public abstract upload(data: Buffer): Promise<UploadSummary<any>>;

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

    public static async signature(data: Buffer): Promise<UploadCandidate> {
        const header = await data.slice(0, Storage.maxSignatureSize);

        let foundSig: Signature | null = null;
        for (const sig of Storage.signatures) {
            if (Storage.sigCompare(sig.head, header)) {
                foundSig = sig;
                break;
            }
        }

        if (foundSig === null)
            throw new Error('Cannot identify file type');
        
        const format = foundSig.format;

        let type: MediaType;
        if (format === 'jpeg' || format === 'png')
            type = 'image';
        else
            throw new Error('Unknown media type for MediaFormat ' + format);
        
        let extension: MediaExtension;
        if (format === 'jpeg')
            extension = 'jpg';
        else if (format === 'png')
            extension = 'png';
        else
            throw new Error('Unknown media extension for MediaFormat ' + format);

        return {
            extension,
            type,
            format
        };
    }

    private static sigCompare(sig: Array<number | null>, head: Buffer): boolean {
        if (head.length < sig.length)
            throw new Error(`Not enough header bytes, got ${head.length}, needed ${sig.length}`);
        
        for (let i = 0; i < sig.length; i++) {
            if (sig[i] !== null && sig[i] !== head[i])
                return false;
        }

        return true;
    }
}

interface Signature {
    format: MediaFormat;
    head: Array<number | null>;
}
