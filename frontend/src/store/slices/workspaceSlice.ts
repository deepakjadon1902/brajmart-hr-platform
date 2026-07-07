import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/services/api";
import type {
  Asset,
  AttendanceRecord,
  Client,
  Employee,
  EmployeeDocument,
  Holiday,
  Invoice,
  LeaveRequest,
  Message,
  Notification,
  PermissionGrant,
  Payslip,
  RoleAssignment,
  Shift,
  Task,
} from "@/types";

type NewEmployee = Omit<Employee, "id" | "role" | "companyId" | "status" | "joinDate"> &
  Partial<Pick<Employee, "id" | "role" | "companyId" | "status" | "joinDate">>;

interface WorkspaceState {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  holidays: Holiday[];
  shifts: Shift[];
  payslips: Payslip[];
  assets: Asset[];
  notifications: Notification[];
  clients: Client[];
  invoices: Invoice[];
  documents: EmployeeDocument[];
  messages: Message[];
  roleAssignments: RoleAssignment[];
  permissionGrants: PermissionGrant[];
  tasks: Task[];
}

type RootLikeState = {
  auth?: { user?: { id?: string; companyId?: string } | null };
  company?: { activeId?: string };
  workspace?: WorkspaceState;
};

const workspaceCachePrefix = "workspace_cache_v2";

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const minutesFromTime = (value?: string) => {
  const [hours, minutes] = String(value || "")
    .split(":")
    .map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};
const hoursBetweenTimes = (start?: string, end?: string) => {
  const startMinutes = minutesFromTime(start);
  const endMinutes = minutesFromTime(end);
  if (startMinutes === null || endMinutes === null) return 0;
  const diff =
    endMinutes >= startMinutes ? endMinutes - startMinutes : endMinutes + 24 * 60 - startMinutes;
  return Math.round((diff / 60) * 100) / 100;
};
const nowStamp = () => {
  const d = new Date();
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`;
};

const defaultState: WorkspaceState = {
  employees: [],
  attendance: [],
  leaves: [],
  holidays: [],
  shifts: [],
  payslips: [],
  assets: [],
  notifications: [],
  clients: [],
  invoices: [],
  documents: [],
  messages: [],
  roleAssignments: [],
  permissionGrants: [],
  tasks: [],
};

function workspaceCacheKey(userId?: string, companyId?: string) {
  return userId ? `${workspaceCachePrefix}:${userId}:${companyId || "default"}` : "";
}

function currentCacheKey() {
  try {
    const rawUser = localStorage.getItem("auth_user");
    const user = rawUser ? (JSON.parse(rawUser) as { id?: string; companyId?: string }) : null;
    return workspaceCacheKey(user?.id, localStorage.getItem("active_company") || user?.companyId);
  } catch {
    return "";
  }
}

function readWorkspaceCache(userId?: string, companyId?: string): Partial<WorkspaceState> | null {
  try {
    const raw = localStorage.getItem(workspaceCacheKey(userId, companyId));
    return raw ? (JSON.parse(raw) as Partial<WorkspaceState>) : null;
  } catch {
    return null;
  }
}

function persistWorkspaceCache(
  state: Partial<WorkspaceState>,
  userId?: string,
  companyId?: string,
) {
  try {
    const key = userId || companyId ? workspaceCacheKey(userId, companyId) : currentCacheKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify({ ...defaultState, ...state }));
  } catch {
    // Ignore storage quota/private-mode failures; API refresh remains the source of truth.
  }
}

const initialState = {
  ...defaultState,
  ...(readWorkspaceCache(
    (() => {
      try {
        const raw = localStorage.getItem("auth_user");
        return raw ? (JSON.parse(raw) as { id?: string }).id : undefined;
      } catch {
        return undefined;
      }
    })(),
    (() => {
      try {
        const raw = localStorage.getItem("auth_user");
        const user = raw ? (JSON.parse(raw) as { companyId?: string }) : null;
        return localStorage.getItem("active_company") || user?.companyId;
      } catch {
        return undefined;
      }
    })(),
  ) ?? {}),
};
const resources = [
  "attendance",
  "leaves",
  "holidays",
  "shifts",
  "payslips",
  "assets",
  "notifications",
  "clients",
  "invoices",
  "documents",
  "messages",
  "roleAssignments",
  "permissionGrants",
  "tasks",
] as const;

function normalizeEmployee(item: Partial<Employee> & { _id?: string }): Employee {
  return {
    id: String(item.id ?? item._id ?? ""),
    name: item.name ?? "Employee",
    email: item.email ?? "",
    role: item.role ?? "employee",
    companyId: item.companyId ?? "c1",
    department: item.department,
    designation: item.designation,
    phone: item.phone,
    avatar: item.avatar,
    joinDate: item.joinDate,
    status: item.status ?? "active",
    location: item.location,
    manager: item.manager,
    salary: item.salary,
    baseSalary: item.baseSalary,
    monthlyCtc: item.monthlyCtc,
    annualCtc: item.annualCtc,
    bankAccount: item.bankAccount,
  };
}

export const fetchEmployees = createAsyncThunk("workspace/fetchEmployees", async () => {
  const { data } = await api.get("/users", { params: { limit: 100 } });
  return (data.data as Array<Partial<Employee> & { _id?: string }>).map(normalizeEmployee);
});

export const hydrateWorkspaceCache = createAsyncThunk(
  "workspace/hydrateCache",
  async ({ userId, companyId }: { userId?: string; companyId?: string }) =>
    readWorkspaceCache(userId, companyId),
);

export const fetchWorkspace = createAsyncThunk(
  "workspace/fetchWorkspace",
  async (_, { getState }) => {
    const [
      attendance,
      leaves,
      holidays,
      shifts,
      payslips,
      assets,
      notifications,
      clients,
      invoices,
      documents,
      messages,
      roleAssignments,
      permissionGrants,
      tasks,
    ] = await Promise.all(
      resources.map(async (resource) => {
        const url =
          resource === "documents"
            ? "/documents"
            : resource === "messages"
              ? "/messages"
              : `/workspace/${resource}`;
        try {
          const { data } = await api.get(url);
          return data.data;
        } catch (error: unknown) {
          if (typeof error === "object" && error && "response" in error) {
            const status = (error as { response?: { status?: number } }).response?.status;
            if (status === 403) return [];
          }
          throw error;
        }
      }),
    );

    const workspace = {
      attendance,
      leaves,
      holidays,
      shifts,
      payslips,
      assets,
      notifications,
      clients,
      invoices,
      documents,
      messages,
      roleAssignments,
      permissionGrants,
      tasks,
    } as WorkspaceState;
    const state = getState() as RootLikeState;
    persistWorkspaceCache(
      { ...(state.workspace ?? defaultState), ...workspace },
      state.auth?.user?.id,
      state.company?.activeId || state.auth?.user?.companyId,
    );
    return workspace;
  },
);

export const createEmployee = createAsyncThunk(
  "workspace/createEmployee",
  async (employee: NewEmployee) => {
    const { data } = await api.post("/users", {
      name: employee.name,
      email: employee.email,
      password: employee.password,
      role: employee.role ?? "employee",
      department: employee.department,
      designation: employee.designation,
      phone: employee.phone,
      salary: employee.salary ?? employee.monthlyCtc,
      baseSalary: employee.baseSalary,
      monthlyCtc: employee.monthlyCtc,
      annualCtc: employee.annualCtc,
      bankAccount: employee.bankAccount,
      location: employee.location,
      manager: employee.manager,
      companyId: employee.companyId,
    });
    return normalizeEmployee(data.data);
  },
);

export const updateEmployee = createAsyncThunk(
  "workspace/updateEmployee",
  async (employee: Partial<Employee> & Pick<Employee, "id">) => {
    const { id, ...body } = employee;
    const { data } = await api.patch(`/users/${id}`, body);
    return normalizeEmployee(data.data);
  },
);

export const addClient = createAsyncThunk(
  "workspace/addClient",
  async (client: Omit<Client, "id" | "lastUpdated" | "addedBy"> & { addedBy?: string }) => {
    const { data } = await api.post("/workspace/clients", client);
    return data.data as Client;
  },
);

export const upsertInvoice = createAsyncThunk(
  "workspace/upsertInvoice",
  async (invoice: Partial<Invoice> & Pick<Invoice, "clientId">) => {
    const amount = Number(invoice.amount ?? 0);
    const tax = Number(invoice.tax ?? Math.round(amount * 0.18));
    const payload = { ...invoice, amount, tax, total: amount + tax };
    const { data } = invoice.id
      ? await api.patch(`/workspace/invoices/${invoice.id}`, payload)
      : await api.post("/workspace/invoices", payload);
    return data.data as Invoice;
  },
);

export const markAttendance = createAsyncThunk(
  "workspace/markAttendance",
  async (
    record: { employeeId: string; employeeName?: string; location?: AttendanceRecord["location"] },
    { getState },
  ) => {
    const state = getState() as { workspace: WorkspaceState };
    const date = today();
    const existing = state.workspace.attendance.find(
      (item) => item.employeeId === record.employeeId && item.date === date,
    );
    if (existing) {
      const checkOut = existing.checkIn && !existing.checkOut ? nowTime() : existing.checkOut;
      const { data } = await api.patch(`/workspace/attendance/${existing.id}`, {
        checkIn: existing.checkIn || nowTime(),
        checkOut,
        status: "present",
        hoursWorked:
          existing.checkIn && checkOut
            ? hoursBetweenTimes(existing.checkIn, checkOut)
            : existing.hoursWorked,
        location: record.location ?? existing.location,
      });
      return data.data as AttendanceRecord;
    }
    const { data } = await api.post("/workspace/attendance", {
      ...record,
      date,
      checkIn: nowTime(),
      status: "present",
      hoursWorked: 0,
    });
    return data.data as AttendanceRecord;
  },
);

export const applyLeave = createAsyncThunk(
  "workspace/applyLeave",
  async (leave: {
    employeeId?: string;
    employeeName?: string;
    type: LeaveRequest["type"];
    from: string;
    to: string;
    reason: string;
  }) => {
    const { data } = await api.post("/workspace/leaves", leave);
    return data.data as LeaveRequest;
  },
);

export const updateLeaveStatus = createAsyncThunk(
  "workspace/updateLeaveStatus",
  async ({ id, status }: { id: string; status: LeaveRequest["status"] }) => {
    const { data } = await api.patch(`/workspace/leaves/${id}`, { status });
    return data.data as LeaveRequest;
  },
);

export const addDocument = createAsyncThunk(
  "workspace/addDocument",
  async (document: {
    employeeId: string;
    employeeName: string;
    name: string;
    type: string;
    size?: string;
    file?: File;
  }) => {
    if (!document.file) throw new Error("Please choose a real document file to upload.");
    const form = new FormData();
    form.set("employeeId", document.employeeId);
    form.set("name", document.name);
    form.set("type", document.type);
    form.set("file", document.file);
    const { data } = await api.post("/documents", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data as EmployeeDocument;
  },
);

export const updateDocumentStatus = createAsyncThunk(
  "workspace/updateDocumentStatus",
  async ({ id, status }: { id: string; status: EmployeeDocument["status"] }) => {
    const { data } = await api.patch(`/documents/${id}`, { status });
    return data.data as EmployeeDocument;
  },
);

export const sendMessage = createAsyncThunk(
  "workspace/sendMessage",
  async (
    message: Omit<Message, "id" | "sentOn" | "read" | "toName"> &
      Partial<Pick<Message, "read" | "toName">>,
  ) => {
    const { data } = await api.post("/messages", message);
    return data.data as Message | Message[];
  },
);

export const paySalary = createAsyncThunk(
  "workspace/paySalary",
  async (
    { employeeId, month, deductions }: { employeeId: string; month: string; deductions?: number },
    { getState },
  ) => {
    const state = getState() as { workspace: WorkspaceState };
    const employee = state.workspace.employees.find((item) => item.id === employeeId);
    if (!employee) throw new Error("Employee not found");
    const gross = employee.monthlyCtc ?? employee.salary ?? 0;
    const finalDeductions = Number(deductions ?? Math.round(gross * 0.08));
    const { data } = await api.post("/workspace/payslips", {
      employeeId,
      employeeName: employee.name,
      month,
      gross,
      deductions: finalDeductions,
      net: Math.max(0, gross - finalDeductions),
      status: "paid",
    });
    return data.data as Payslip;
  },
);

export const setPermissionGrant = createAsyncThunk(
  "workspace/setPermissionGrant",
  async ({ id, granted }: { id: string; granted: boolean }) => {
    const { data } = await api.patch(`/workspace/permissionGrants/${id}`, { granted });
    return data.data as PermissionGrant;
  },
);

export const addRoleAssignment = createAsyncThunk(
  "workspace/addRoleAssignment",
  async (assignment: { employeeId: string; roleName: string; workScope: string }) => {
    const { data } = await api.post("/workspace/roleAssignments", assignment);
    return data.data as RoleAssignment;
  },
);

export const addPermissionGrant = createAsyncThunk(
  "workspace/addPermissionGrant",
  async (grant: { employeeId: string; permission: string; granted?: boolean }) => {
    const { data } = await api.post("/workspace/permissionGrants", grant);
    return data.data as PermissionGrant;
  },
);

export const addTask = createAsyncThunk(
  "workspace/addTask",
  async (task: {
    employeeId: string;
    title: string;
    description?: string;
    priority?: Task["priority"];
    dueDate?: string;
  }) => {
    const { data } = await api.post("/workspace/tasks", task);
    return data.data as Task;
  },
);

export const updateTask = createAsyncThunk(
  "workspace/updateTask",
  async (task: Partial<Task> & Pick<Task, "id">) => {
    const { id, ...body } = task;
    const { data } = await api.patch(`/workspace/tasks/${id}`, body);
    return data.data as Task;
  },
);

const slice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    addEmployee(state, action: PayloadAction<NewEmployee>) {
      const employee: Employee = {
        ...action.payload,
        id: action.payload.id ?? `e${Date.now()}`,
        role: action.payload.role ?? "employee",
        companyId: action.payload.companyId ?? "c1",
        status: action.payload.status ?? "active",
        joinDate: action.payload.joinDate ?? today(),
      };

      state.employees.unshift(employee);
    },
    upsertCurrentEmployee(state, action: PayloadAction<Employee>) {
      const employee = normalizeEmployee(action.payload);
      const existing = state.employees.find((item) => item.id === employee.id);
      if (existing) Object.assign(existing, employee);
      else state.employees.unshift(employee);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspace.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(hydrateWorkspaceCache.fulfilled, (state, action) => {
        if (action.payload) Object.assign(state, { ...defaultState, ...action.payload });
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.employees = action.payload;
        persistWorkspaceCache(state);
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.employees.unshift(action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const existing = state.employees.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
        else state.employees.unshift(action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(addClient.fulfilled, (state, action) => {
        state.clients.unshift(action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(upsertInvoice.fulfilled, (state, action) => {
        const existing = state.invoices.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
        else state.invoices.unshift(action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        const existing = state.attendance.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
        else state.attendance.unshift(action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.leaves.unshift(action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        const existing = state.leaves.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(addDocument.fulfilled, (state, action) => {
        state.documents.unshift(action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(updateDocumentStatus.fulfilled, (state, action) => {
        const existing = state.documents.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const messages = Array.isArray(action.payload) ? action.payload : [action.payload];
        state.messages.unshift(...messages);
        persistWorkspaceCache(state);
      })
      .addCase(paySalary.fulfilled, (state, action) => {
        state.payslips.unshift(action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(setPermissionGrant.fulfilled, (state, action) => {
        const existing = state.permissionGrants.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(addRoleAssignment.fulfilled, (state, action) => {
        state.roleAssignments.unshift(action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(addPermissionGrant.fulfilled, (state, action) => {
        state.permissionGrants.unshift(action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
        persistWorkspaceCache(state);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const existing = state.tasks.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
        else state.tasks.unshift(action.payload);
        persistWorkspaceCache(state);
      });
  },
});

export const { addEmployee, upsertCurrentEmployee } = slice.actions;
export default slice.reducer;
