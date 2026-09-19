import { NextResponse } from "next/server";
interface IApiResponse<T> {
  status: number;
  message: string;
  errorCode: string;
  data: T;
}
export class ApiResponse<T> implements IApiResponse<T> {
  constructor(
    public status: number,
    public message: string,
    public errorCode: string,
    public data: T,
  ) {}

  public static success<T>(
    data: T,
    message: string = "Success",
  ): NextResponse<ApiResponse<T>> {
    const response = new ApiResponse(200, message, "SUCCESS", data);
    return NextResponse.json(response, { status: 200 });
  }

  public static failed<T>(
    message: string,
    errorCode: string = "UNKNOWN_ERROR",
    status: number = 500,
  ): NextResponse<ApiResponse<T>> {
    const response = new ApiResponse<T>(status, message, errorCode, null as T);
    return NextResponse.json(response, { status });
  }
}
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface PageData<T> {
  items: T[];
  pagination: Pagination;
}

export class ApiPageResponse<T> {
  status: number;
  message: string;
  errorCode: string;
  data: T;
  pagination: Pagination;

  constructor(
    status: number,
    message: string,
    errorCode: string,
    data: T,
    pagination: Pagination,
  ) {
    this.status = status;
    this.message = message;
    this.errorCode = errorCode;
    this.data = data;
    this.pagination = pagination;
  }

  public static success<T>(
    data: T,
    pagination: Pagination,
    message: string = "Success",
  ): NextResponse<ApiPageResponse<T>> {
    const response = new ApiPageResponse(
      200,
      message,
      "SUCCESS",
      data,
      pagination,
    );

    return NextResponse.json(response, {
      status: 200,
    });
  }
}
