export interface GraylogOptionsInterface {
    host: string;

    /** @default 12201 */
    port?: number;

    /** @default 1000 milliseconds */
    timeout?: number;

    /** @default udp4 */
    protocol?: "udp4" | "udp6";

    /** @default 3 */
    flatDepthLevel?: number;
}
