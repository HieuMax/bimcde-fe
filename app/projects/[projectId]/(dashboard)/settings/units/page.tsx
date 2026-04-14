"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useApi } from "@/app/hooks/useApi";

// -------------------- Sub-components --------------------

const UnitRow = ({
  label,
  options,
  defaultValue,
  precisionValue,
  showPrecisionLabel = false,
  onChange,
  precisionOnChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  defaultValue: string;
  precisionValue: string;
  showPrecisionLabel?: boolean;
  onChange: (value: string) => void;
  precisionOnChange: (value: string) => void;
}) => (
  <div className="grid grid-cols-12 gap-4 items-end mb-4">
    <div className="col-span-8">
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
        {label}
      </label>
      <Select value={defaultValue} onValueChange={onChange}>
        <SelectTrigger className="w-full h-9 bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="col-span-4">
      <label
        className={`text-sm font-medium text-muted-foreground mb-1.5 block ${
          !showPrecisionLabel ? "invisible h-[20px]" : ""
        }`}>
        Display precision
      </label>
      <Select value={precisionValue} onValueChange={precisionOnChange}>
        <SelectTrigger className="w-full h-9 bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.1">0.1</SelectItem>
          <SelectItem value="0.01">0.01</SelectItem>
          <SelectItem value="0.001">0.001</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

// -------------------- Main Page --------------------

export default function UnitSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { get, put } = useApi();
  const [useSameSetting, setUseSameSetting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track unit settings
  const [units, setUnits] = useState({
    angularunit: "deg",
    angularunitformat: "0.001",
    areaunit: "ft2",
    areaunitformat: "0.01",
    lengthmeasurementunit: "in",
    lengthmeasurementunitformat: "0.1",
    lengthunit: "in",
    lengthunitformat: "0.1",
    unitsystem: "imperial",
    volumeunit: "yd3",
    volumeunitformat: "0.001",
    weightunit: "ton",
    weightunitformat: "0.001",
  });

  useEffect(() => {
    const fetchUnits = async () => {
      const projectId = (await params).projectId;

      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        const response = await get(`/units/get/${projectId}`);
        if (response.success) {
          setUnits(response.result || units);
        } else {
          console.error("Failed to fetch units:", response.error);
        }
      } catch (e: any) {
        setErrorMessage(e.response.data.error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const handleSave = async () => {
    const projectId = (await params).projectId;

    if (!projectId) return;

    try {
      const response = await put(`/units/update/${projectId}`, units);
      if (response.success) {
        alert("Units updated successfully");
      } else {
        alert(response.error || "Failed to update units");
      }
    } catch (error) {
      alert("Error updating units");
    }
  };

  const handleChange = (key: string, value: string) => {
    setUnits((prevUnits) => ({
      ...prevUnits,
      [key]: value,
    }));
  };

  const handlePrecisionChange = (key: string, value: string) => {
    setUnits((prevUnits) => ({
      ...prevUnits,
      [key + "format"]: value,
    }));
  };

  const unitData = {
    length: [
      { label: "in", value: "in" },
      { label: "ft", value: "ft" },
      { label: "yd", value: "yd" },
      { label: "mi", value: "mi" },
    ],
    measurements: [
      { label: "in", value: "in" },
      { label: "ft", value: "ft" },
      { label: "m", value: "m" },
    ],
    area: [
      { label: "ft2", value: "ft2" },
      { label: "yd2", value: "yd2" },
      { label: "m2", value: "m2" },
    ],
    volume: [
      { label: "ft3", value: "ft3" },
      { label: "yd3", value: "yd3" },
      { label: "m3", value: "m3" },
    ],
    weight: [
      { label: "lb", value: "lb" },
      { label: "ton", value: "ton" },
      { label: "kg", value: "kg" },
    ],
    angle: [
      { label: "deg", value: "deg" },
      { label: "rad", value: "rad" },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        <p>{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-muted ">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-normal text-gray-800">Units</h1>
        <Button
          onClick={handleSave}
          className="bg-[#406D87] hover:bg-[#345a70] h-9 px-6 text-white">
          Save changes
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="col-span-1">
              <p className="text-sm text-muted-foreground mt-1">
                Choose how units should be displayed in the 2D & 3D viewer
              </p>
            </div>
            {/* Cột phải: Chi tiết các Unit (tương đương phần Table bên trang Tag) */}
            <div className="col-span-2">
              <div className="col-span-1 border-r pr-6 border-muted pb-11">
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Unit system
                </label>
                <Select
                  value={units.unitsystem}
                  onValueChange={(value) => handleChange("unitsystem", value)}>
                  <SelectTrigger className="w-full h-9 bg-background">
                    <SelectValue placeholder="Imperial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imperial">Imperial</SelectItem>
                    <SelectItem value="metric">Metric</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Length */}
              <UnitRow
                label="Length"
                options={unitData.length}
                defaultValue={units.lengthunit}
                precisionValue={units.lengthunitformat}
                onChange={(value) => handleChange("lengthunit", value)}
                precisionOnChange={(value) =>
                  handlePrecisionChange("lengthunit", value)
                }
                showPrecisionLabel={true}
              />

              {/* Checkbox ẩn/hiện Measurements */}
              <div className="flex items-center space-x-2 my-6 py-2 px-3 bg-muted/50 rounded-md">
                <Checkbox
                  id="same-setting"
                  checked={useSameSetting}
                  onCheckedChange={(checked) =>
                    setUseSameSetting(checked as boolean)
                  }
                />
                <label
                  htmlFor="same-setting"
                  className="text-sm font-medium text-gray-600 cursor-pointer selection:bg-transparent">
                  Use same setting for measurements
                </label>
              </div>

              {/* Measurements Row (Bị ẩn hoàn toàn khi tích checkbox) */}
              {!useSameSetting && (
                <UnitRow
                  label="Measurements"
                  options={unitData.measurements}
                  defaultValue={units.lengthmeasurementunit}
                  precisionValue={units.lengthmeasurementunitformat}
                  onChange={(value) =>
                    handleChange("lengthmeasurementunit", value)
                  }
                  precisionOnChange={(value) =>
                    handlePrecisionChange("lengthmeasurementunit", value)
                  }
                  showPrecisionLabel={false}
                />
              )}

              {/* Area, Volume, Weight, Angle */}
              <UnitRow
                label="Area"
                options={unitData.area}
                defaultValue={units.areaunit}
                precisionValue={units.areaunitformat}
                onChange={(value) => handleChange("areaunit", value)}
                precisionOnChange={(value) =>
                  handlePrecisionChange("areaunit", value)
                }
              />
              <UnitRow
                label="Volume"
                options={unitData.volume}
                defaultValue={units.volumeunit}
                precisionValue={units.volumeunitformat}
                onChange={(value) => handleChange("volumeunit", value)}
                precisionOnChange={(value) =>
                  handlePrecisionChange("volumeunit", value)
                }
              />
              <UnitRow
                label="Weight"
                options={unitData.weight}
                defaultValue={units.weightunit}
                precisionValue={units.weightunitformat}
                onChange={(value) => handleChange("weightunit", value)}
                precisionOnChange={(value) =>
                  handlePrecisionChange("weightunit", value)
                }
              />
              <UnitRow
                label="Angle"
                options={unitData.angle}
                defaultValue={units.angularunit}
                precisionValue={units.angularunitformat}
                onChange={(value) => handleChange("angularunit", value)}
                precisionOnChange={(value) =>
                  handlePrecisionChange("angularunit", value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
