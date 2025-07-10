import { Exception } from "@odg/exception";

import { GraylogException, GraylogLogger } from "~/index";

describe("GrayLog logger instance", () => {
    test("Test not init", async () => {
        const logger = new GraylogLogger({
            host: "",
            timeout: 10,
        });

        await expect(logger.info("test")).rejects.toThrow(GraylogException);
    });

    test("Test logs message", async () => {
        const logger = new GraylogLogger({
            host: "127.0.0.1",
            timeout: 10,
        });
        await logger.init();

        await Promise.all([
            expect(logger.info({
                exception: {
                    message: "message",
                },
            })).resolves.not.toThrow(),
            expect(logger.info({
                request: {
                    url: "request_ur",
                },
            })).resolves.not.toThrow(),
            expect(logger.info({
                message: "message",
            })).resolves.not.toThrow(),
            expect(logger.info({
                other: "other",
            })).resolves.not.toThrow(),
        ]);
    });

    test("Test Reject Promise", async () => {
        const logger = new GraylogLogger({
            host: "",
            timeout: 10,
        });
        const withResolvers = Promise.withResolvers();
        logger["onMessageError"](withResolvers.resolve, withResolvers.reject, "errorData");

        await expect(withResolvers.promise).rejects.toThrow(Exception);
    });
});
