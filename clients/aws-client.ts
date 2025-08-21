import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { KanbanBoard } from '../application/kanban-board';
import { Task } from '../application/models/task';

async function getS3Client(): Promise<S3Client> {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
    try {
        const client = new S3Client({ region, credentials: defaultProvider() });
        return client;
    } catch (err) {
        console.error('Failed to create S3 client', err);
        throw err;
    }
}

async function streamToString(stream: any): Promise<string> {
    return await new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}

export async function saveBoardToS3(bucket: string, key: string, board: KanbanBoard): Promise<void> {
    const client = await getS3Client();
    const payload = {
        backlog: board.backlog.getTasks().map(t => ({ name: t.name, creator: (t as any).creator, taskId: (t as any).taskId })),
        inProgress: board.inProgress.getTasks().map(t => ({ name: t.name, creator: (t as any).creator, taskId: (t as any).taskId })),
        complete: board.complete.getTasks().map(t => ({ name: t.name, creator: (t as any).creator, taskId: (t as any).taskId }))
    };
    const body = JSON.stringify(payload);
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'application/json' });
    try {
        await client.send(cmd);
    } catch (err) {
        console.error('Failed to save board to S3', err);
        throw err;
    }
}

export async function loadBoardFromS3(bucket: string, key: string, board: KanbanBoard): Promise<void> {
    const client = await getS3Client();
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    let resp;
    try {
        resp = await client.send(cmd);
    } catch (err) {
        console.error('Failed to load object from S3', err);
        throw err;
    }
    if (!resp.Body) throw new Error('No body in S3 object');
    const text = await streamToString(resp.Body as any);
    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (err) {
        console.error('Failed to parse S3 object as JSON', err);
        throw err;
    }

    board.clearBoard();

    if (Array.isArray(parsed.backlog)) {
        parsed.backlog.forEach((item: any) => board.addToBacklog(new Task(item.name, item.creator, undefined, item.taskId)));
    }
    if (Array.isArray(parsed.inProgress)) {
        parsed.inProgress.forEach((item: any) => board.addToInProgress(new Task(item.name, item.creator, undefined, item.taskId)));
    }
    if (Array.isArray(parsed.complete)) {
        parsed.complete.forEach((item: any) => board.addToComplete(new Task(item.name, item.creator, undefined, item.taskId)));
    }
}
