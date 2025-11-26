// types/vercel.d.ts
export type VercelRequest = import('http').IncomingMessage & { query: any; body: any };
export type VercelResponse = import('http').ServerResponse & {
	status: (code: number) => VercelResponse;
	json: (body: any) => VercelResponse;
};
