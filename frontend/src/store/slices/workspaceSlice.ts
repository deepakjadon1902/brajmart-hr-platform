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
}

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
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
};

const initialState = defaultState;
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
    salary: item.salary,
    baseSalary: item.baseSalary,
    monthlyCtc: item.monthlyCtc,
    annualCtc: item.annualCtc,
  };
}

export const fetchEmployees = createAsyncThunk("workspace/fetchEmployees", async () => {
  const { data } = await api.get("/users", { params: { limit: 100 } });
  return (data.data as Array<Partial<Employee> & { _id?: string }>).map(normalizeEmployee);
});

export const fetchWorkspace = createAsyncThunk("workspace/fetchWorkspace", async () => {
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

  return {
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
  } as WorkspaceState;
});

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
      const { data } = await api.patch(`/workspace/attendance/${existing.id}`, {
        checkIn: existing.checkIn || nowTime(),
        checkOut: existing.checkIn && !existing.checkOut ? nowTime() : undefined,
        status: "present",
        hoursWorked: existing.checkIn && !existing.checkOut ? Math.max(existing.hoursWorked ?? 8, 8) : 0,
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
    employeeId: string;
    employeeName: string;
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
  async (message: Omit<Message, "id" | "sentOn" | "read"> & Partial<Pick<Message, "read">>) => {
    const { data } = await api.post("/messages", message);
    return data.data as Message;
  },
);

export const paySalary = createAsyncThunk(
  "workspace/paySalary",
  async ({ employeeId, month, deductions }: { employeeId: string; month: string; deductions?: number }, { getState }) => {
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
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.employees = action.payload;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.employees.unshift(action.payload);
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const existing = state.employees.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
        else state.employees.unshift(action.payload);
      })
      .addCase(addClient.fulfilled, (state, action) => {
        state.clients.unshift(action.payload);
      })
      .addCase(upsertInvoice.fulfilled, (state, action) => {
        const existing = state.invoices.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
        else state.invoices.unshift(action.payload);
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        const existing = state.attendance.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
        else state.attendance.unshift(action.payload);
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.leaves.unshift(action.payload);
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        const existing = state.leaves.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
      })
      .addCase(addDocument.fulfilled, (state, action) => {
        state.documents.unshift(action.payload);
      })
      .addCase(updateDocumentStatus.fulfilled, (state, action) => {
        const existing = state.documents.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.unshift(action.payload);
      })
      .addCase(paySalary.fulfilled, (state, action) => {
        state.payslips.unshift(action.payload);
      })
      .addCase(setPermissionGrant.fulfilled, (state, action) => {
        const existing = state.permissionGrants.find((item) => item.id === action.payload.id);
        if (existing) Object.assign(existing, action.payload);
      });
  },
});

export const {
  addEmployee,
  upsertCurrentEmployee,
} = slice.actions;
export default slice.reducer;
