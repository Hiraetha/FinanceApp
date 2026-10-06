import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // If response already matches structure, return it
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return res;
        }

        let message = 'Success';
        let data = res;

        if (res && typeof res === 'object' && 'message' in res && 'data' in res) {
          message = res.message;
          data = res.data;
        }

        return {
          success: true,
          data: data ?? null,
          message: message || 'Success',
        };
      }),
    );
  }
}
