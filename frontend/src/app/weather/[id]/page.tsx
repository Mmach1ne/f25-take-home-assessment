"use client";

//suggestion: have a lookup and a stored list of ids so users can choose from a table
//popular locations and user's favorites can be added as well as a local weather could be userful

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

//copied from api documentation
interface StoredWeather {
  id: string;
  date: string;
  location: string;
  notes: string;
  weather: {
    location: Record<string, unknown>;
    current: {
      temperature?: number;
      weather_descriptions?: string[];
      humidity?: number;
      wind_speed?: number;
      wind_dir?: string;
      [key: string]: unknown;
    };
  };
}

export default function WeatherById() {
  const { id } = useParams() as { id?: string };
//setup local states
  const [loading, setLoading] = useState<boolean>(!!id);
  const [data, setData] = useState<StoredWeather | null>(null);
  const [error, setError] = useState<string>("");

//fetch function to lookout for id change
  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`http://localhost:8000/weather/${id}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const { detail } = await res.json();
          throw new Error(detail || `Server returned ${res.status}`);
        }
        setData((await res.json()) as StoredWeather);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

//Rendering, use global css to avoid extra formatting
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Weather Lookup</CardTitle>
        <CardDescription>
          {id
            ? `Showing data for ID: ${id}`
            : "No ID supplied in the URL."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && <p className="text-sm">Loading…</p>}

        {error && (
          <p className="text-sm text-red-500 border border-red-500/40 bg-red-900/20 rounded p-3">
            {error}
          </p>
        )}

        {data && (
          <div className="space-y-3 border rounded p-4 bg-muted/20">
            <h3 className="font-medium text-lg">{data.location}</h3>
            <p className="text-sm">Date: {data.date}</p>
            {data.notes && (
              <p className="text-sm italic text-muted-foreground">
                Notes: {data.notes}
              </p>
            )}

            <hr className="my-2" />

            <div className="text-sm space-y-1">
              <p>
                Temp:{" "}
                <span className="font-semibold">
                  {data.weather.current.temperature ?? "—"}°C
                </span>
              </p>
              <p>
                Description:{" "}
                {data.weather.current.weather_descriptions?.[0] ?? "—"}
              </p>
              <p>
                Humidity: {data.weather.current.humidity ?? "—"}%
              </p>
              <p>
                Wind: {data.weather.current.wind_speed ?? "—"} km/h{" "}
                {data.weather.current.wind_dir ?? ""}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
