import util from "node:util";

import { Exception } from "@odg/exception";
import { type JSONLoggerString, type JSONLogger } from "@odg/json-log";
import { AbstractLogger, type LogLevel, type LoggerInterface } from "@odg/log";
import Gelf from "gelf-pro";

import { GelfLogLevels } from "@enums/GelfLogLevels";
import { GraylogException } from "~/exceptions/GraylogException";
import { type GraylogOptionsInterface } from "~/interfaces/GraylogOptionsInterface";

type flattenType<T, R> = (target: T, options?: { delimiter: string; maxDepth: number }) => R;

/**
 * Classe responsável por salvar os arquivos de logs do GrayLog
 *
 * @task [INI-5035](https://grupo123.atlassian.net/browse/INI-5035)
 * @task [INI-2505](https://grupo123.atlassian.net/browse/INI-2505)
 */
export class GraylogLogger extends AbstractLogger implements LoggerInterface {

    private logger?: typeof Gelf;

    private flatten?: flattenType<unknown, Record<string, unknown>>;

    public constructor(protected options: GraylogOptionsInterface) {
        super();
    }

    public async init(): Promise<void> {
        this.logger = Gelf;

        this.logger.setConfig({
            adapterOptions: {
                host: this.options.host,
                port: this.options.port,
                timeout: this.options.timeout,
                protocol: this.options.protocol,
            },
        });

        const { flatten } = await import("flat");
        this.flatten = flatten;
    }

    public async log(level: LogLevel, message: JSONLoggerString, options?: Record<string, string>): Promise<void> {
        if (!this.logger) throw new GraylogException("Graylog init not executed");

        const titleContent = message.exception?.message
            ?? message.request?.url
            ?? util.format(message.message);

        const logTitle = `${options?.title ?? ""} ${titleContent}`.trim();

        const withResolvers = Promise.withResolvers<undefined>();
        const messageItens: JSONLogger | Record<string, unknown> = { ...message, ...options };
        delete messageItens.createdAt;
        delete messageItens.message;

        const defaultFlat = 3;

        this.logger.message(
            logTitle,
            GelfLogLevels[level],
            this.flatten!(messageItens, { delimiter: "_", maxDepth: this.options.flatDepthLevel ?? defaultFlat }),
            this.onMessageError.bind(this, withResolvers.resolve, withResolvers.reject),
        );

        return withResolvers.promise;
    }

    private onMessageError(
        resolve: (reason?: undefined) => unknown,
        reject: (reason?: unknown) => unknown,
        error: unknown,
    ): void {
        error ? reject(Exception.parse(error)) : resolve();
    }

}
