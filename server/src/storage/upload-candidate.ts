import { MediaType, MediaFormat, MediaExtension } from '../../../shared/lib/api';

export interface UploadCandidate {
    type: MediaType;
    format: MediaFormat;
    extension: MediaExtension;
}
