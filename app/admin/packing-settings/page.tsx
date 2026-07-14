"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  findOptimalBox,
  CactusPlant,
  PackingDetail,
  PackingSettings,
  BOX_SIZES,
} from "@/lib/packing-algorithm";
import { PackingEngine, PackingConfig } from "@/lib/packing";

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function PackingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [tissuePaddingNoSpines, setTissuePaddingNoSpines] =
    useState<string>("1");
  const [tissuePaddingSpines, setTissuePaddingSpines] = useState<string>("1");
  const [tissueSpacingBetweenLayers, setTissueSpacingBetweenLayers] =
    useState<string>("1");
  const [tissueSpacingBottom, setTissueSpacingBottom] = useState<string>("2");

  const [samplePlants, setSamplePlants] = useState<CactusPlant[]>([
    {
      id: createId(),
      name: "Small cactus",
      sizeCm: 6,
      heightCm: 6,
      hasSpines: false,
      quantity: 2,
    },
    {
      id: createId(),
      name: "Tall cactus",
      sizeCm: 8,
      heightCm: 12,
      hasSpines: true,
      quantity: 1,
    },
  ]);
  const [newPlantName, setNewPlantName] = useState("New plant");
  const [newPlantSize, setNewPlantSize] = useState<string>("8");
  const [newPlantHeight, setNewPlantHeight] = useState<string>("8");
  const [newPlantHasSpines, setNewPlantHasSpines] = useState(false);
  const [newPlantQuantity, setNewPlantQuantity] = useState<string>("1");

  const [packingResult, setPackingResult] = useState<
    PackingDetail | PackingDetail[] | null
  >(null);
  const [packingError, setPackingError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/packing-settings");
        const data = await res.json();
        if (data?.ok && data.data) {
          const doc = data.data as Partial<
            PackingConfig & { updatedAt?: string }
          >;
          setUpdatedAt(doc.updatedAt ?? null);
          // Map new PackingConfig to display state
          if (doc.bottomFiller !== undefined)
            setTissueSpacingBottom(String(doc.bottomFiller));
          if (doc.layerFiller !== undefined)
            setTissueSpacingBetweenLayers(String(doc.layerFiller));
          if (doc.topFiller !== undefined)
            setTissuePaddingSpines(String(doc.topFiller));
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        setError("Failed to load packing settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        action: "publish",
        json: {
          bottomFiller: Number(tissueSpacingBottom),
          topFiller: Number(tissuePaddingSpines),
          layerFiller: Number(tissueSpacingBetweenLayers),
        },
      };

      const res = await fetch("/api/admin/packing-settings", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error || JSON.stringify(data?.errors || "save failed"));
        return;
      }
      if (data.data?.updatedAt) setUpdatedAt(data.data.updatedAt);
      setSuccess("Saved packing settings");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError("Failed to save packing settings");
    }
  }

  const currentSettings: PackingConfig = useMemo(
    () => ({
      bottomFiller: Number(tissueSpacingBottom),
      topFiller: Number(tissuePaddingSpines),
      layerFiller: Number(tissueSpacingBetweenLayers),
    }),
    [tissueSpacingBottom, tissuePaddingSpines, tissueSpacingBetweenLayers],
  );

  function updatePlant(id: string, patch: Partial<CactusPlant>) {
    setSamplePlants((current) =>
      current.map((plant) =>
        plant.id === id ? { ...plant, ...patch } : plant,
      ),
    );
  }

  function removePlant(id: string) {
    setSamplePlants((current) => current.filter((plant) => plant.id !== id));
  }

  function addPlant() {
    const size = Number(newPlantSize) || 0;
    const height = Number(newPlantHeight) || size;
    const quantity = Math.max(1, Math.floor(Number(newPlantQuantity) || 1));
    const plant: CactusPlant = {
      id: createId(),
      name: newPlantName || "New plant",
      sizeCm: size,
      heightCm: height,
      hasSpines: newPlantHasSpines,
      quantity,
    };
    setSamplePlants((current) => [plant, ...current]);
    setNewPlantName("New plant");
    setNewPlantSize("8");
    setNewPlantHeight("8");
    setNewPlantHasSpines(false);
    setNewPlantQuantity("1");
  }

  function calculatePacking() {
    setPackingError(null);
    setPackingResult(null);
    setSuccess(null);
    try {
      if (samplePlants.length === 0) {
        setPackingError("Please add at least one sample plant.");
        return;
      }
      const result = findOptimalBox(samplePlants, true, currentSettings);
      setPackingResult(result);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      setPackingError(err?.message || "Packing calculation failed");
    }
  }

  function renderPackingResult(result: PackingDetail | PackingDetail[]) {
    if (!result) return null;
    const results = Array.isArray(result) ? result : [result];
    return results.map((box, index) => (
      <div key={index} className="rounded-xl border p-4 mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-semibold text-base">
              Box: {box.shippingBox.name}
            </div>
            <div className="text-xs text-muted-foreground">
              Dimensions: {box.shippingBox.widthCm}×{box.shippingBox.lengthCm}×
              {box.shippingBox.heightCm} cm
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {box.totalBoxesPacked} boxes
            </div>
            <div className="text-xs text-muted-foreground">
              Utilization: {box.utilization.toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mb-3">
          Height: {box.totalHeight.toFixed(1)} cm | Used:{" "}
          {box.usedVolume.toFixed(0)} cm³ | Free: {box.freeVolume.toFixed(0)}{" "}
          cm³
        </div>
        <div className="mt-3 space-y-2">
          {box.layers.map((layer) => (
            <div
              key={layer.layerNumber}
              className="rounded-lg bg-muted/10 p-2 text-xs"
            >
              <div className="font-medium">
                Layer {layer.layerNumber} ({layer.placements.length} items,
                height: {layer.usedHeight.toFixed(1)} cm)
              </div>
              {layer.fillerBelow > 0 && (
                <div className="text-muted-foreground">
                  ↳ Filler below: {layer.fillerBelow} cm
                </div>
              )}
              {layer.fillerAbove > 0 && (
                <div className="text-muted-foreground">
                  ↳ Filler above: {layer.fillerAbove} cm
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ));
  }

  return (
    <div className="p-4 space-y-6">
      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold">Packing Settings</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="mt-4 space-y-4 rounded-3xl border p-6">
            <div>
              <p className="text-sm font-medium">Packing Material Settings</p>
              <p className="text-xs text-muted-foreground">
                These values control vertical filler material (tissue paper)
                placement. Small boxes automatically add 1cm cardboard walls on
                all sides.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bottom Filler (cm)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={tissueSpacingBottom}
                  onChange={(e) => setTissueSpacingBottom(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tissue at box bottom
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Layer Filler (cm)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={tissueSpacingBetweenLayers}
                  onChange={(e) =>
                    setTissueSpacingBetweenLayers(e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tissue between layers
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Top Filler (cm)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={tissuePaddingSpines}
                  onChange={(e) => setTissuePaddingSpines(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tissue at box top
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleSave}>Save</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTissueSpacingBottom("2");
                  setTissueSpacingBetweenLayers("1");
                  setTissuePaddingSpines("2");
                }}
              >
                Reset to defaults
              </Button>
              {updatedAt && (
                <div className="text-sm text-muted-foreground">
                  Updated: {updatedAt}
                </div>
              )}
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}
          </div>
        )}
      </div>

      <div className="max-w-5xl space-y-4">
        <div className="rounded-3xl border p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Packing simulation</h2>
            <p className="text-sm text-muted-foreground">
              Add sample plants and calculate the selected box configuration.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border p-4">
                <p className="font-medium text-sm mb-3">New sample plant</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    value={newPlantName}
                    onChange={(e) => setNewPlantName(e.target.value)}
                    placeholder="Plant name"
                  />
                  <Input
                    value={newPlantQuantity}
                    onChange={(e) => setNewPlantQuantity(e.target.value)}
                    placeholder="Quantity"
                  />
                  <Input
                    value={newPlantSize}
                    onChange={(e) => setNewPlantSize(e.target.value)}
                    placeholder="Diameter (cm)"
                  />
                  <Input
                    value={newPlantHeight}
                    onChange={(e) => setNewPlantHeight(e.target.value)}
                    placeholder="Height (cm)"
                  />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={newPlantHasSpines}
                      onCheckedChange={(value) =>
                        setNewPlantHasSpines(Boolean(value))
                      }
                    />
                    Has spines
                  </label>
                  <Button onClick={addPlant}>Add plant</Button>
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="font-medium text-sm mb-3">Sample plants</p>
                <div className="space-y-3">
                  {samplePlants.map((plant) => (
                    <div
                      key={plant.id}
                      className="rounded-2xl border p-3 bg-background"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">{plant.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {plant.sizeCm} cm diameter • {plant.heightCm} cm
                            height • {plant.hasSpines ? "spines" : "no spines"}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePlant(plant.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-4">
                        <Input
                          value={plant.name}
                          onChange={(e) =>
                            updatePlant(plant.id, { name: e.target.value })
                          }
                          placeholder="Name"
                        />
                        <Input
                          value={String(plant.sizeCm)}
                          onChange={(e) =>
                            updatePlant(plant.id, {
                              sizeCm: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="Diameter"
                        />
                        <Input
                          value={String(plant.heightCm ?? plant.sizeCm)}
                          onChange={(e) =>
                            updatePlant(plant.id, {
                              heightCm: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="Height"
                        />
                        <Input
                          value={String(plant.quantity)}
                          onChange={(e) =>
                            updatePlant(plant.id, {
                              quantity: Math.max(
                                1,
                                Number(e.target.value) || 1,
                              ),
                            })
                          }
                          placeholder="Qty"
                        />
                      </div>
                    </div>
                  ))}
                  {samplePlants.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No sample plants added yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={calculatePacking}>Calculate</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSamplePlants([]);
                    setPackingResult(null);
                    setPackingError(null);
                  }}
                >
                  Clear samples
                </Button>
              </div>
              {packingError && (
                <div className="text-sm text-destructive">{packingError}</div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border p-4">
                <p className="font-medium text-sm mb-3">Current settings</p>
                <Textarea
                  readOnly
                  value={JSON.stringify(currentSettings, null, 2)}
                  rows={8}
                />
              </div>

              <div className="rounded-2xl border p-4">
                <p className="font-medium text-sm mb-3">Packing result</p>
                {packingResult ? (
                  renderPackingResult(packingResult)
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Press Calculate to simulate box selection.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border p-4">
                <p className="font-medium text-sm mb-3">Raw output</p>
                <Textarea
                  readOnly
                  value={
                    packingResult ? JSON.stringify(packingResult, null, 2) : ""
                  }
                  rows={10}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
