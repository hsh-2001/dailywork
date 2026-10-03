"use client";

import {
  useCreateProject,
  useProjects,
  useUpdateProject,
} from "@/hooks/project.hook";
import {
  ICreateProjectRequest,
  IUpdateProjectRequest,
} from "@/shares/dtos/project/createRequest";
import { IProjectResponse } from "@/shares/dtos/project/projectResponse";
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
} from "antd";
import { FolderKanban, Pencil, Plus } from "lucide-react";
import { useState } from "react";

interface ProjectFormValues {
  name: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
}

export default function ProjectsPage() {
  const [form] = Form.useForm<ProjectFormValues>();
  const projectsQuery = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const [editingProject, setEditingProject] = useState<IProjectResponse | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSaving = createProject.isPending || updateProject.isPending;

  const openCreate = () => {
    setEditingProject(null);
    setSubmitError(null);
    form.resetFields();
    form.setFieldValue("status", "ACTIVE");
    setIsModalOpen(true);
  };

  const openEdit = (project: IProjectResponse) => {
    setEditingProject(project);
    setSubmitError(null);
    form.setFieldsValue({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    form.resetFields();
    setSubmitError(null);
  };

  const handleSubmit = async (values: ProjectFormValues) => {
    setSubmitError(null);
    const createData: ICreateProjectRequest = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
    };
    try {
      if (editingProject) {
        const updateData: IUpdateProjectRequest = {
          ...createData,
          status: values.status,
        };
        await updateProject.mutateAsync({
          id: editingProject.id,
          data: updateData,
        });
      } else {
        await createProject.mutateAsync(createData);
      }
      closeModal();
    } catch {
      setSubmitError("Couldn't save this project. Please try again.");
    }
  };

  const projects: IProjectResponse[] = projectsQuery.data?.data ?? [];
  const activeProjects = projects.filter(
    (project) => project.status === "ACTIVE",
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">Your workspace</p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              Projects
            </h1>
            <p className="mt-0.5 max-w-2xl text-xs text-slate-500 sm:text-sm">
              Manage projects available in your work logs.
            </p>
          </div>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={16} />}
            onClick={openCreate}
            aria-label="Add project"
            title="Add project"
            className="shrink-0 !h-8 !w-8 !px-0"
          />
        </header>

        {!projectsQuery.isError &&
          !projectsQuery.isLoading &&
          projects.length > 0 && (
            <section
              aria-label="Project overview"
              className="mb-4 grid grid-cols-2 gap-2"
            >
              <div className="flex items-baseline justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-[11px] font-medium text-slate-500">
                  Total projects
                </p>
                <p className="text-base font-semibold tabular-nums text-slate-900">
                  {projects.length}
                </p>
              </div>
              <div className="flex items-baseline justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-[11px] font-medium text-slate-500">Active</p>
                <p className="text-base font-semibold tabular-nums text-emerald-700">
                  {activeProjects}
                </p>
              </div>
            </section>
          )}

        {projectsQuery.isError ? (
          <Alert
            type="error"
            showIcon
            message="Couldn't load projects"
            description="Check your connection and try again."
            action={
              <Button size="small" onClick={() => projectsQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold text-slate-800">
                All projects
              </h2>
              {!projectsQuery.isLoading && (
                <span className="text-xs text-slate-500">
                  {projects.length} {projects.length === 1 ? "project" : "projects"}
                </span>
              )}
            </div>
            {projectsQuery.isLoading ? (
              <ul
                aria-label="Loading projects"
                className="divide-y divide-slate-100"
              >
                {[0, 1, 2].map((item) => (
                  <li
                    key={item}
                    className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <Skeleton
                        active
                        title={{ width: "35%" }}
                        paragraph={{ rows: 1, width: ["65%"] }}
                      />
                    </div>
                    <Skeleton.Button active size="small" />
                  </li>
                ))}
              </ul>
            ) : projects.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <FolderKanban
                  size={26}
                  className="mx-auto text-slate-300"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-medium text-slate-800">
                  No projects yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Add a project to select it in a work log.
                </p>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={openCreate}
                  className="mt-4"
                >
                  Add project
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {projects.map((project) => (
                  <li
                    key={project.id}
                    className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-slate-50/70 sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                          <FolderKanban size={17} aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-slate-900">
                              {project.name}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                project.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {project.status === "ACTIVE"
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </span>
                        </span>
                      </div>
                      {project.description && (
                        <p className="ml-12 mt-1 line-clamp-2 text-sm text-slate-500">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <Button
                      aria-label={`Edit ${project.name}`}
                      icon={<Pencil size={15} />}
                      onClick={() => openEdit(project)}
                    >
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <Modal
        title={editingProject ? "Edit project" : "New project"}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingProject ? "Save changes" : "Create project"}
        confirmLoading={isSaving}
        cancelButtonProps={{ disabled: isSaving }}
        closable={!isSaving}
        maskClosable={!isSaving}
        destroyOnHidden
      >
        {submitError && (
          <Alert className="mb-4" type="error" showIcon message={submitError} />
        )}
        <Form<ProjectFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: "ACTIVE" }}
        >
          <Form.Item
            name="name"
            label="Project name"
            rules={[
              { required: true, whitespace: true, message: "Enter a project name" },
              { max: 150, message: "Project names can be up to 150 characters" },
            ]}
          >
            <Input autoFocus maxLength={150} placeholder="e.g. Website redesign" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              maxLength={2000}
              showCount
              placeholder="Add a short description (optional)"
            />
          </Form.Item>
          {editingProject && (
            <Form.Item name="status" label="Status">
              <Select
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </main>
  );
}
