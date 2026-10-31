import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/services/api";
import type { Team, TeamCandidate, TeamInput } from "@/types";

function message(error: unknown, fallback: string) {
  const response = (error as { response?: { data?: { message?: string } } })?.response;
  return response?.data?.message || (error instanceof Error ? error.message : fallback);
}
export const fetchTeams = createAsyncThunk("teams/fetch", async () => {
  try {
    return (await api.get("/teams")).data.data as Team[];
  } catch (error) {
    throw new Error(message(error, "Unable to load teams"));
  }
});
export const fetchTeamOptions = createAsyncThunk("teams/options", async () => {
  try {
    return (await api.get("/teams/options")).data.data as {
      members: TeamCandidate[];
      managers: Array<{ id: string; name: string; email: string }>;
    };
  } catch (error) {
    throw new Error(message(error, "Unable to load available employees"));
  }
});
export const saveTeam = createAsyncThunk(
  "teams/save",
  async (input: TeamInput & { id?: string }) => {
    try {
      const { id, ...body } = input;
      return (id ? await api.patch(`/teams/${id}`, body) : await api.post("/teams", body)).data
        .data as Team;
    } catch (error) {
      throw new Error(message(error, "Unable to save team"));
    }
  },
);

const initialState = {
  list: [] as Team[],
  members: [] as TeamCandidate[],
  managers: [] as Array<{ id: string; name: string; email: string }>,
  loading: false,
  error: "",
  optionsLoading: false,
  optionsError: "",
  requestId: "",
  optionsRequestId: "",
};
const slice = createSlice({
  name: "teams",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state, action) => {
        state.loading = true;
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.list = action.payload;
        state.loading = false;
        state.error = "";
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.error.message || "Unable to load teams";
      })
      .addCase(fetchTeamOptions.pending, (state, action) => {
        state.optionsLoading = true;
        state.optionsError = "";
        state.optionsRequestId = action.meta.requestId;
      })
      .addCase(fetchTeamOptions.fulfilled, (state, action) => {
        if (state.optionsRequestId !== action.meta.requestId) return;
        state.members = action.payload.members;
        state.managers = action.payload.managers;
        state.optionsLoading = false;
      })
      .addCase(fetchTeamOptions.rejected, (state, action) => {
        if (state.optionsRequestId !== action.meta.requestId) return;
        state.optionsLoading = false;
        state.optionsError = action.error.message || "Unable to load employees";
      })
      .addCase(saveTeam.fulfilled, (state, action) => {
        state.requestId = "";
        const existing = state.list.find((team) => team.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
        else state.list.unshift(action.payload);
      })
      .addCase("auth/logout", () => initialState)
      .addCase("auth/login/pending", () => initialState)
      .addCase("auth/googleLogin/pending", () => initialState);
  },
});
export default slice.reducer;
