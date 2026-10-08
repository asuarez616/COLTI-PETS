import type {Locale} from '../domain/model';
export type ErrorKind='network'|'validation'|'permission'|'upload'|'image'|'confirmation'|'conflict'|'unavailable'|'catalogUnavailable';
export type Operation='catalog'|'confirmation'|'recovery'|'upload'|'image'|'production'|'login';
export class ApplicationError extends Error{
 constructor(public readonly kind:ErrorKind,public readonly operation:Operation,public readonly retryable:boolean,public readonly reason?:string){super(kind);this.name='ApplicationError';}
}
/** Raw provider diagnostics stop here; customer-facing messages never include them. */
export function normalizeError(value:unknown,operation:Operation):ApplicationError{
 if(value instanceof ApplicationError)return value;
 const error=value as {message?:unknown;code?:unknown;status?:unknown}|null;
 const code=typeof error?.code==='string'?error.code:'';
 const message=typeof error?.message==='string'?error.message:'';
 const status=typeof error?.status==='number'?error.status:0;
 if(/CATALOG_UNAVAILABLE/.test(message))return new ApplicationError('catalogUnavailable',operation,false);
 if(/IDEMPOTENCY_CONFLICT|STATE_CONFLICT/.test(message)||status===409)return new ApplicationError('conflict',operation,false);
 if(/AUTH_REQUIRED|OWNER_REQUIRED|ORIGIN_DENIED|permission denied|not authorized/i.test(message)||code==='42501'||status===401||status===403)return new ApplicationError('permission',operation,false);
 if(/INVALID_|REQUIRED|LIMIT|CHANGED|DUPLICATE_|INVALID_DATA/.test(message)||code.startsWith('22')||code.startsWith('23')){
  // Keep only known transaction rejection codes, never provider text or user data.
  const reason=code==='P0001'?message.match(/^(INVALID_CUSTOMER|INVALID_TAG_SELECTION|ID_TAG_CHANGED|INVALID_TAG|DESIGN_CHANGED|FONT_CHANGED|INVALID_ATTACHMENT_PURPOSE|INVALID_ATTACHMENT|ATTACHMENT_REQUIRED|INVALID_DECORATION|INVALID_INFORMATION_ICONS|INVALID_EXTRA_DETAILS|INVALID_EXTRA_TEXT|INVALID_EXTRA_CATEGORIES|INVALID_TYPE|INVALID_SIZE|INVALID_PERSONALIZATION|ITEM_LIMIT|RATE_LIMIT)(?:\s|$)/)?.[1]:undefined;
  return new ApplicationError('validation',operation,false,reason);
 }
 if(/NOT_CONFIGURED/.test(message))return new ApplicationError('unavailable',operation,false);
 if(value instanceof TypeError||/fetch|network|offline|timeout|connection/i.test(message)||status>=500)return new ApplicationError('network',operation,true);
 return new ApplicationError(operation==='upload'?'upload':operation==='image'?'image':operation==='confirmation'?'confirmation':'network',operation,true);
}
export function errorMessage(value:unknown,locale:Locale,operation:Operation):string{
 const e=normalizeError(value,operation),es=locale==='es';
 if(operation==='confirmation'&&e.reason){
  if(e.reason==='INVALID_CUSTOMER')return es?'Revisa el nombre y teléfono del cliente.':'Check the customer name and phone number.';
  if(/ATTACHMENT/.test(e.reason))return es?'Una imagen ya no está disponible. Vuelve a cargarla en el collar correspondiente.':'An image is no longer available. Upload it again on the corresponding collar.';
  if(/TAG_SELECTION|ID_TAG_CHANGED/.test(e.reason))return es?'Una placa cambió o ya no está disponible. Edita la placa y vuelve a seleccionarla.':'A tag changed or is no longer available. Edit the tag and select it again.';
  if(e.reason==='INVALID_TAG')return es?'Revisa el nombre y teléfono de las placas.':'Check the pet names and phone numbers on the tags.';
  if(e.reason==='FONT_CHANGED')return es?'Una tipografía ya no está disponible. Edita el collar y elige otra.':'A font is no longer available. Edit the collar and choose another.';
  if(e.reason==='DESIGN_CHANGED')return es?'Un diseño ya no está disponible para la talla elegida. Edita el collar y selecciona otro.':'A design is no longer available for the selected size. Edit the collar and select another.';
 }
 if(e.kind==='permission')return es?'No tienes permiso para realizar esta acción.':'You don’t have permission to do that.';
 if(e.kind==='catalogUnavailable')return es?'Este diseño ya no está disponible. Edita el collar y elige otro diseño.':'This design is no longer available. Edit the collar and choose another design.';
 if(e.kind==='conflict')return es?'El pedido cambió. Recupera la versión guardada antes de continuar.':'The order changed. Recover the saved version before continuing.';
 if(e.kind==='unavailable')return es?'Este servicio aún no está disponible.':'This service is not available yet.';
 if(e.kind==='validation')return operation==='upload'?(es?'Elige una imagen JPEG, PNG, SVG o WebP válida de hasta 10 MB.':'Choose a valid JPEG, PNG, SVG or WebP image up to 10 MB.'):(es?'Revisa tus datos antes de continuar.':'Please check your details before continuing.');
 const messages={catalog:es?'No pudimos cargar el catálogo.':'We couldn’t load the catalog.',confirmation:es?'No pudimos guardar tu pedido.':'We couldn’t save your order.',recovery:es?'No pudimos recuperar tu pedido guardado.':'We couldn’t load your saved order.',upload:es?'No pudimos subir la imagen.':'We couldn’t upload your image.',image:es?'No pudimos cargar la imagen.':'We couldn’t load the image.',production:es?'No pudimos actualizar los pedidos.':'We couldn’t update the orders.',login:es?'No pudimos iniciar sesión.':'We couldn’t sign you in.'};
 return messages[operation];
}
