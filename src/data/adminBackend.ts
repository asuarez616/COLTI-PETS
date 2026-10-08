// Composition boundary: administrative UI consumes application operations only.
export {admin} from '../infrastructure/admin';
export {mode} from '../infrastructure/supabaseRepositories';
import {repositories} from '../infrastructure/supabaseRepositories';
import {admin as adminApplication} from '../infrastructure/admin';
import {createDriveConnection} from '../application/driveConnection';
import {driveHttpRepository} from '../infrastructure/driveConnection';
export const adminAuth=repositories.auth;
export const driveConnection=createDriveConnection(driveHttpRepository,()=>adminApplication.authorized());

export {uploadImage} from '../infrastructure/adminUploads';
