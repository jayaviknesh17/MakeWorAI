"use client";

import { AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ConvexStatusBanner() {
  const isConvexConfigured = !!process.env.NEXT_PUBLIC_CONVEX_URL;

  // Always return null since Convex is now configured
  return null;

  return (
    <Card className="border-amber-500/20 bg-amber-500/5 mb-6" data-convex-banner>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-200 mb-1">
              Database Not Connected
            </h3>
            <p className="text-sm text-amber-100/80 mb-3">
              Your app is running in demo mode. To enable full functionality including data persistence, 
              analytics, and user management, you'll need to set up Convex.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
                asChild
              >
                <a 
                  href="https://docs.convex.dev/quickstart" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Setup Guide
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10"
                onClick={() => {
                  const banner = document.querySelector('[data-convex-banner]');
                  if (banner) banner.style.display = 'none';
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}