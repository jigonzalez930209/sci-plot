import type {
    PluginContext,
    PluginManifest,
    DataUpdateEvent,
    ViewChangeEvent,
    InteractionEvent,
} from "../../types";
import { definePlugin } from "../../PluginRegistry";

export interface DataLoggerConfig {
    /** Log data updates (default: true) */
    logDataUpdates?: boolean;
    /** Log view changes (default: true) */
    logViewChanges?: boolean;
    /** Log interactions (default: false) */
    logInteractions?: boolean;
    /** Maximum log entries to keep (default: 100) */
    maxEntries?: number;
}

const dataLoggerManifest: PluginManifest = {
    name: "data-logger",
    version: "1.0.0",
    description: "Logs chart events for debugging and analysis",
    provides: ["analysis"],
    tags: ["debug", "logging", "events"],
};

export const DataLoggerPlugin = definePlugin<DataLoggerConfig>(
    dataLoggerManifest,
    (config = {}) => {
        const {
            logDataUpdates = true,
            logViewChanges = true,
            logInteractions = false,
            maxEntries = 100,
        } = config;

        interface LogEntry {
            timestamp: number;
            type: string;
            data: unknown;
        }

        const entries: LogEntry[] = [];

        function addEntry(type: string, data: unknown) {
            entries.push({
                timestamp: Date.now(),
                type,
                data,
            });

            if (entries.length > maxEntries) {
                entries.shift();
            }
        }

        return {
            onInit(ctx: PluginContext) {
                ctx.log.info("Data logger initialized");
            },

            onDataUpdate(ctx: PluginContext, event: DataUpdateEvent) {
                if (logDataUpdates) {
                    addEntry("dataUpdate", {
                        seriesId: event.seriesId,
                        mode: event.mode,
                        pointCount: event.pointCount,
                    });
                    ctx.log.debug(`Data update: ${event.seriesId} (${event.mode}, ${event.pointCount} points)`);
                }
            },

            onViewChange(ctx: PluginContext, event: ViewChangeEvent) {
                if (logViewChanges) {
                    addEntry("viewChange", {
                        trigger: event.trigger,
                        bounds: event.current,
                    });
                    ctx.log.debug(`View change: ${event.trigger}`);
                }
            },

            onInteraction(_ctx: PluginContext, event: InteractionEvent) {
                if (logInteractions) {
                    addEntry("interaction", {
                        type: event.type,
                        pixelX: event.pixelX,
                        pixelY: event.pixelY,
                        inPlotArea: event.inPlotArea,
                    });
                }
            },

            onSerialize(_ctx: PluginContext) {
                return { entries };
            },

            onDeserialize(_ctx: PluginContext, data: unknown) {
                const saved = data as { entries?: LogEntry[] };
                if (saved?.entries) {
                    entries.length = 0;
                    entries.push(...saved.entries);
                }
            },

            api: {
                getEntries() {
                    return [...entries];
                },
                clear() {
                    entries.length = 0;
                },
                export() {
                    return JSON.stringify(entries, null, 2);
                },
            },
        };
    }
);
