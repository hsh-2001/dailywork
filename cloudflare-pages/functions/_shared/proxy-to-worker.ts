interface PagesEnvironment {
  WORKER_API_ORIGIN: string;
}

interface PagesRequestContext {
  request: Request;
  env: PagesEnvironment;
}

function getWorkerOrigin(value: string | undefined) {
  if (!value) {
    throw new Error("WORKER_API_ORIGIN is not configured.");
  }

  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("WORKER_API_ORIGIN must be an HTTPS origin without a path.");
  }

  return url.origin;
}

export async function proxyToWorker({ request, env }: PagesRequestContext) {
  let target: URL;
  try {
    target = new URL(request.url);
    target = new URL(`${target.pathname}${target.search}`, getWorkerOrigin(env.WORKER_API_ORIGIN));
  } catch (error) {
    console.error("Invalid Cloudflare Pages Worker proxy configuration", error);
    return new Response("Worker API proxy is not configured correctly.", { status: 500 });
  }

  try {
    return await fetch(new Request(target, request));
  } catch (error) {
    console.error("Cloudflare Pages request to the Worker failed", error);
    return new Response("Unable to reach the application Worker.", { status: 502 });
  }
}
