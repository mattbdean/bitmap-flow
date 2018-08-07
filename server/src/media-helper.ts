import { MediaExtension, MediaFormat, MediaType } from '@bitmap-flow/shared/lib/api';
import * as _ from 'lodash';
import { UploadCandidate } from './storage/upload-candidate';

export class MediaHelper {
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

    private static readonly maxSignatureSize: number = _(MediaHelper.signatures)
        .map((s) => s.head.length)
        .max() || 0;

    public async signature(data: Buffer): Promise<UploadCandidate> {
        const header = await data.slice(0, MediaHelper.maxSignatureSize);

        let foundSig: Signature | null = null;
        for (const sig of MediaHelper.signatures) {
            if (MediaHelper.sigCompare(sig.head, header)) {
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
