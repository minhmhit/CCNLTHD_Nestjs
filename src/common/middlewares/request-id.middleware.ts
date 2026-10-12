import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = randomUUID();
    req['requestId'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    // console.log(
    //   `[${requestId}] ${req.method} ${req.originalUrl}`,
    // );
    next();
  }
}
