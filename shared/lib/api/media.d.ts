import { ObjectId } from 'mongodb';
import { MediaExtension } from './media-extension';
import { MediaFormat } from './media-format';
import { MediaType } from './media-type';
import { UploadSummary } from './upload-summary';
export interface Media {
    _id?: ObjectId | string;
    filename?: string;
    format: MediaFormat;
    type: MediaType;
    extension: MediaExtension;
    hash: string;
    tags: string[];
    source: string | null;
    fromUrl: string | null;
    upload: UploadSummary<any>;
    uploadedAt: Date;
}
//# sourceMappingURL=media.d.ts.map