import {Controller, Get} from '@nestjs/common';


@Controller()
export class AppController {

    @Get()
    greeting(): string {
        return 'Hello from minhmh';
    }
}