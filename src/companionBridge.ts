import * as bodyParser from 'body-parser';
import * as express from 'express';
import { log } from './extension';

const PORT = 27121;

export class Bridge {
    app: express.Express;

    constructor(handle: (problem: any) => void) {
        this.app = express();
        this.app.use(bodyParser.json());

        this.app.post('/', (req, res) => {
            const data = req.body;

            log!.info(`Bridge: Received problem: "${data.name}", group "${data.group}"`);

            res.sendStatus(200);
            handle(data);
        });

        this.app.listen(PORT, err => {
            if (err) {
                log!.error(err);
                return;
            }

            log!.info(`Listening for competitive companion on port ${PORT}`);
        });
    }
}
