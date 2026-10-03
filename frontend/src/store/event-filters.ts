"use client";
import { create } from "zustand";

type Filters = {
  search: string;
  period: string;
  visibility: string;
  tag: string;
  sort: string;
  setSearch: (search: string) => void;
  setPeriod: (period: string) => void;
  setVisibility: (visibility: string) => void;
  setTag: (tag: string) => void;
  setSort: (sort: string) => void;
  hydrate: (values: Partial<Omit<Filters, "setSearch" | "setPeriod" | "setVisibility" | "setTag" | "setSort" | "hydrate">>) => void;
};

export const useEventFilters = create<Filters>((set) => ({
  search: "",
  period: "upcoming",
  visibility: "all",
  tag: "",
  sort: "date-asc",
  setSearch: (search) => set({ search }),
  setPeriod: (period) => set({ period }),
  setVisibility: (visibility) => set({ visibility }),
  setTag: (tag) => set({ tag }),
  setSort: (sort) => set({ sort }),
  hydrate: (values) => set(values),
}));
