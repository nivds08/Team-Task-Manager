(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const state = {
    user: null,
    projects: [],
    dashboard: { summary: {}, tasks: [] },
    taskFilter: "all",
    taskSearch: "",
    activeTab: "overview",
    loading: false,
  };

  const els = {
    shell: $("#appShell"),
    loading: $("#appLoading"),
    userEmail: $("#userEmail"),
    userRole: $("#userRole"),
    logoutBtn: $("#logoutBtn"),
    toastHost: $("#toastHost"),
    tabBtns: $$("[data-tab]"),
    panels: $$("[data-panel]"),
    statCards: $$("[data-stat-filter]"),
    taskSearch: $("#taskSearch"),
    summaryTotal: $("#summaryTotal"),
    summaryTodo: $("#summaryTodo"),
    summaryProgress: $("#summaryProgress"),
    summaryDone: $("#summaryDone"),
    summaryOverdue: $("#summaryOverdue"),
    taskTableBody: $("#taskTableBody"),
    projectsGrid: $("#projectsGrid"),
    projectForm: $("#projectForm"),
    taskForm: $("#taskForm"),
    projectSelect: $("#projectSelect"),
    assignSelect: $("#assignSelect"),
    adminSection: $("#adminSection"),
    messageBanner: $("#messageBanner"),
    pageHeading: $("#pageHeading"),
    pageSub: $("#pageSub"),
    userAvatar: $("#userAvatar"),
  };

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatRole(role) {
    if (role === "user") return "Member";
    if (role === "admin") return "Admin";
    return role;
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function overdueTask(task) {
    if (!task.dueDate || task.status === "done") return false;
    const end = new Date(task.dueDate);
    const now = new Date();
    return end < now;
  }

  function toast(message, variant = "info") {
    const node = document.createElement("div");
    node.className = `toast toast-${variant}`;
    node.textContent = message;
    els.toastHost.appendChild(node);
    requestAnimationFrame(() => node.classList.add("toast-visible"));
    setTimeout(() => {
      node.classList.remove("toast-visible");
      setTimeout(() => node.remove(), 220);
    }, 3200);
  }

  function setBanner(text, variant) {
    if (!text) {
      els.messageBanner.hidden = true;
      els.messageBanner.textContent = "";
      els.messageBanner.className = "banner";
      return;
    }
    els.messageBanner.hidden = false;
    els.messageBanner.textContent = text;
    els.messageBanner.className = `banner banner-${variant}`;
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok) {
      const msg = data.message || data.error || `Request failed (${response.status})`;
      const err = new Error(msg);
      err.status = response.status;
      err.body = data;
      throw err;
    }
    return data;
  }

  function setLoading(on) {
    state.loading = on;
    els.loading.hidden = !on;
    els.shell?.classList.toggle("is-loading", on);
  }

  function syncAssigneesFromProject(projectId) {
    const id = Number(projectId);
    const project = state.projects.find((p) => p.id === id);
    const select = els.assignSelect;
    if (!select) return;
    select.innerHTML = "";
    if (!project || !project.teamMembers?.length) {
      select.disabled = true;
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = project ? "No team members on this project" : "Select a project first";
      select.appendChild(opt);
      return;
    }
    select.disabled = false;
    for (const m of project.teamMembers) {
      const opt = document.createElement("option");
      opt.value = String(m.id);
      const roleLabel = m.role?.name ? formatRole(m.role.name) : "";
      opt.textContent = roleLabel ? `${m.email} (${roleLabel})` : m.email;
      select.appendChild(opt);
    }
  }

  function filteredDashboardTasks() {
    let list = [...state.dashboard.tasks];
    const q = state.taskSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.project?.name || "").toLowerCase().includes(q) ||
          (t.assignedTo?.email || "").toLowerCase().includes(q)
      );
    }
    if (state.taskFilter === "overdue") {
      list = list.filter((t) => overdueTask(t));
    } else if (state.taskFilter !== "all") {
      list = list.filter((t) => t.status === state.taskFilter);
    }
    return list;
  }

  function renderSummary() {
    const s = state.dashboard.summary || {};
    els.summaryTotal.textContent = s.total ?? "—";
    els.summaryTodo.textContent = s.todo ?? "—";
    els.summaryProgress.textContent = s.inProgress ?? "—";
    els.summaryDone.textContent = s.done ?? "—";
    els.summaryOverdue.textContent = s.overdue ?? "—";
  }

  function statusBadge(status) {
    const label =
      status === "in_progress" ? "In progress" : status === "done" ? "Done" : "Todo";
    return `<span class="badge badge-${escapeHtml(status)}">${escapeHtml(label)}</span>`;
  }

  function renderTaskRows() {
    const tasks = filteredDashboardTasks();
    if (!tasks.length) {
      els.taskTableBody.innerHTML = `<tr><td colspan="6" class="cell-muted">No tasks match your filters.</td></tr>`;
      return;
    }
    els.taskTableBody.innerHTML = tasks
      .map((t) => {
        const od = overdueTask(t);
        const rowClass = od ? "row-overdue" : "";
        const disabled = state.user.role !== "admin" && t.assignedToId !== state.user.id;
        return `
          <tr class="${rowClass}" data-task-id="${t.id}">
            <td><strong>${escapeHtml(t.title)}</strong>${t.description ? `<div class="subtle">${escapeHtml(t.description)}</div>` : ""}</td>
            <td>${escapeHtml(t.project?.name || "—")}</td>
            <td>${escapeHtml(t.assignedTo?.email || "—")}</td>
            <td>${formatDate(t.dueDate)}</td>
            <td>${statusBadge(t.status)}</td>
            <td class="cell-actions">
              <select class="status-select" data-task-id="${t.id}" ${disabled ? "disabled title=\"You can only update tasks assigned to you\"" : ""}>
                <option value="todo" ${t.status === "todo" ? "selected" : ""}>Todo</option>
                <option value="in_progress" ${t.status === "in_progress" ? "selected" : ""}>In progress</option>
                <option value="done" ${t.status === "done" ? "selected" : ""}>Done</option>
              </select>
            </td>
          </tr>`;
      })
      .join("");

    $$(".status-select", els.taskTableBody).forEach((select) => {
      select.addEventListener("change", async (e) => {
        const id = e.target.dataset.taskId;
        const status = e.target.value;
        try {
          await api(`/api/tasks/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          });
          toast("Task updated", "success");
          await refreshData();
        } catch (err) {
          toast(err.message, "error");
          await refreshData();
        }
      });
    });
  }

  function renderProjects() {
    const isAdmin = state.user.role === "admin";
    if (!state.projects.length) {
      els.projectsGrid.innerHTML = `<p class="cell-muted">No projects yet.${isAdmin ? " Create one using the form in the sidebar." : ""}</p>`;
      return;
    }
    els.projectsGrid.innerHTML = state.projects
      .map((p) => {
        const team = (p.teamMembers || [])
          .map((m) => `<span class="chip">${escapeHtml(m.email)} <small>${escapeHtml(formatRole(m.role?.name))}</small></span>`)
          .join(" ");
        return `
          <article class="project-card" data-project-id="${p.id}">
            <header class="project-card-head">
              <div>
                <h4>${escapeHtml(p.name)}</h4>
                <p class="subtle">${escapeHtml(p.description || "No description")}</p>
              </div>
              <span class="pill">${p.teamMembers?.length || 0} members</span>
            </header>
            <div class="team-row">${team || '<span class="cell-muted">No team members</span>'}</div>
            ${
              isAdmin
                ? `<form class="inline-team-form" data-add-team="${p.id}">
                <input type="number" min="1" name="userId" placeholder="User ID to add" required class="input-inline" />
                <button type="submit" class="btn btn-sm">Add to team</button>
              </form>`
                : ""
            }
          </article>`;
      })
      .join("");

    if (isAdmin) {
      $$(".inline-team-form", els.projectsGrid).forEach((form) => {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const projectId = form.dataset.addTeam;
          const fd = new FormData(form);
          const userId = fd.get("userId");
          try {
            await api(`/api/projects/${projectId}/team`, {
              method: "PATCH",
              body: JSON.stringify({ userId: Number(userId) }),
            });
            form.reset();
            toast("Team updated", "success");
            await loadProjects();
            renderProjects();
            syncProjectSelect();
            syncAssigneesFromProject(els.projectSelect.value);
          } catch (err) {
            toast(err.message, "error");
          }
        });
      });
    }
  }

  function syncProjectSelect() {
    const sel = els.projectSelect;
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = state.projects.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
    if (current && state.projects.some((p) => String(p.id) === current)) sel.value = current;
    else if (sel.options.length) sel.selectedIndex = 0;
    syncAssigneesFromProject(sel.value);
  }

  async function loadDashboard() {
    state.dashboard = await api("/api/dashboard");
  }

  async function loadProjects() {
    state.projects = await api("/api/projects");
  }

  function syncStatFilters() {
    els.statCards.forEach((c) => {
      c.classList.toggle("is-active", (c.dataset.statFilter || "all") === state.taskFilter);
    });
  }

  async function refreshData() {
    setLoading(true);
    setBanner("", null);
    try {
      await Promise.all([loadDashboard(), loadProjects()]);
      renderSummary();
      syncStatFilters();
      renderTaskRows();
      renderProjects();
      syncProjectSelect();
    } catch (err) {
      setBanner(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  function bindChrome() {
    els.userEmail.textContent = state.user.email;
    els.userRole.textContent = formatRole(state.user.role);
    if (els.userAvatar) {
      const em = state.user.email || "?";
      els.userAvatar.textContent = em.trim().charAt(0).toUpperCase();
    }

    const isAdmin = state.user.role === "admin";
    els.adminSection.hidden = !isAdmin;

    els.logoutBtn.addEventListener("click", async () => {
      try {
        await api("/api/auth/logout", { method: "POST" });
      } catch {
        /* still leave */
      }
      window.location.href = "/login";
    });

    els.tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        state.activeTab = tab;
        els.tabBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
        els.panels.forEach((p) => {
          p.classList.toggle("is-active", p.dataset.panel === tab);
        });
        if (els.pageHeading && els.pageSub) {
          if (tab === "projects") {
            els.pageHeading.textContent = "Projects & teams";
            els.pageSub.textContent = "Manage membership and scope across initiatives.";
          } else {
            els.pageHeading.textContent = "Dashboard";
            els.pageSub.textContent = "Track workload, deadlines, and ownership in one place.";
          }
        }
      });
    });

    els.statCards.forEach((card) => {
      card.addEventListener("click", () => {
        const f = card.dataset.statFilter || "all";
        state.taskFilter = f;
        syncStatFilters();
        renderTaskRows();
      });
    });

    els.taskSearch.addEventListener("input", (e) => {
      state.taskSearch = e.target.value;
      renderTaskRows();
    });

    els.projectForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        name: fd.get("name"),
        description: fd.get("description") || "",
      };
      try {
        await api("/api/projects", { method: "POST", body: JSON.stringify(payload) });
        e.target.reset();
        toast("Project created", "success");
        await refreshData();
      } catch (err) {
        toast(err.message, "error");
      }
    });

    els.projectSelect.addEventListener("change", (e) => syncAssigneesFromProject(e.target.value));

    els.taskForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        title: fd.get("title"),
        description: fd.get("description") || "",
        projectId: Number(fd.get("projectId")),
        assignedTo: Number(fd.get("assignedTo")),
        status: fd.get("status") || "todo",
        dueDate: fd.get("dueDate") || undefined,
      };
      if (!payload.dueDate) delete payload.dueDate;
      try {
        await api("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
        e.target.reset();
        syncProjectSelect();
        toast("Task created", "success");
        await refreshData();
      } catch (err) {
        toast(err.message, "error");
      }
    });
  }

  async function init() {
    try {
      const me = await api("/api/auth/me");
      state.user = me.user;
    } catch {
      window.location.href = "/login";
      return;
    }

    els.shell.hidden = false;
    bindChrome();
    await refreshData();
  }

  init();
})();
