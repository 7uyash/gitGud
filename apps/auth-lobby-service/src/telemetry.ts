import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

export const sdk = new NodeSDK({
  traceExporter: new class {
    export(spans: any, resultCallback: (result: any) => void) {
      // Stub exporter - replace with Jaeger/OTLP exporter in production
      resultCallback({ code: 0 });
    }
    shutdown() { return Promise.resolve(); }
  }(),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
console.log('OpenTelemetry SDK started');
