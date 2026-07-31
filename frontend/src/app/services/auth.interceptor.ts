import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const empresaId = localStorage.getItem('empresa_id');
  
  let headers = req.headers;
  if (token) headers = headers.set('Authorization', `Bearer ${token}`);
  if (empresaId) headers = headers.set('x-empresa-id', empresaId);
  
  if (token || empresaId) {
    const cloned = req.clone({ headers });
    return next(cloned);
  }
  
  return next(req);
};

