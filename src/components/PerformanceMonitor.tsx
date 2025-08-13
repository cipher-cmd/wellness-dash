import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
  });

  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    // First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(
        (entry) => entry.name === 'first-contentful-paint'
      );
      if (fcpEntry) {
        setMetrics((prev) => ({ ...prev, fcp: fcpEntry.startTime }));
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        setMetrics((prev) => ({ ...prev, lcp: lastEntry.startTime }));
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'first-input') {
          const firstInputEntry = entry as any;
          setMetrics((prev) => ({
            ...prev,
            fid: firstInputEntry.processingStart - firstInputEntry.startTime,
          }));
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as any;
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      }
      setMetrics((prev) => ({ ...prev, cls: clsValue }));
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Time to First Byte (TTFB)
    const navigationEntry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      setMetrics((prev) => ({
        ...prev,
        ttfb: navigationEntry.responseStart - navigationEntry.requestStart,
      }));
    }

    // Cleanup
    return () => {
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  // Send metrics to analytics (you can replace this with your analytics service)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && metrics.fcp !== null) {
      // Example: Send to Google Analytics or your preferred service
      console.log('Performance Metrics:', metrics);

      // You can send this data to your analytics service
      // analytics.track('performance_metrics', metrics);
    }
  }, [metrics]);

  // Don't render anything in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Only show in development for debugging
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
      <div className="mb-2 font-bold">Performance Monitor (Dev)</div>
      <div>FCP: {metrics.fcp?.toFixed(0)}ms</div>
      <div>LCP: {metrics.lcp?.toFixed(0)}ms</div>
      <div>FID: {metrics.fid?.toFixed(0)}ms</div>
      <div>CLS: {metrics.cls?.toFixed(3)}</div>
      <div>TTFB: {metrics.ttfb?.toFixed(0)}ms</div>
    </div>
  );
}
