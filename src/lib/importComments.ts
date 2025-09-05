// ------------------------------------------------
// Code below is taken from Ayano's Comment Widget
// by Ayano on https://virtualobserver.moe/
// ------------------------------------------------

import type { Database } from "../lib/databaseInterface";
import type { Comment } from "../db/schema";
import { genId } from "./generators";

export async function getAyanoComments(sheetUrl: string): Promise<any[]> {
    const split = sheetUrl.split('/');
    const splitRemoved = split.slice(0, 6);
    const url = `${splitRemoved.join('/')}/gviz/tq?`;
    console.log(url);
    const result = await getSheet(url);
    const json = JSON.parse(result.split('\n')[1].replace(/google.visualization.Query.setResponse\(|\);/g, ''));
    const isPage = (col: any) => col.label == 'Page';
    let pageIdx = json.table.cols.findIndex(isPage);
    let comments = [];
    if (json.table.parsedNumHeaders > 0) {
        for (let r = 0; r < json.table.rows.length; r++) {
            let val1;
            if (!json.table.rows[r].c[pageIdx]) {val1 = ''}
            else {val1 = json.table.rows[r].c[pageIdx].v}
            let comment = {}
            for (let c = 0; c < json.table.cols.length; c++) {
                let val2;
                if (!json.table.rows[r].c[c]) {val2 = ''}
                else {val2 = json.table.rows[r].c[c].v}
                comment[json.table.cols[c].label] = val2;
            }
            comment.Timestamp2 = json.table.rows[r].c[0].f;
            comments.push(comment);
        }
    }
    if (comments.length == 0 || Object.keys(comments[0]).length < 2) { // Once again, Google Sheets can be weird
        return [];
    } else {
        console.log(comments);
        return comments;
    }
}

async function getSheet(url: string) {
    return (await fetch(url)).text();
}

function convertTimestamp(timestamp: string) {
    const vals = timestamp.replace('Date(', '').replace(/\)$/, '').split(',');
    const date = new Date(vals[0], vals[1], vals[2], vals[3], vals[4], vals[5]);
    return date;
}

// - END -

export interface HcbComments {
    comments: HcbComment[];
}

export interface HcbComment {
    comment: string;
    is_reply: boolean;
    image_path: null;
    key: string;
    author: string;
    replies_to_id: string;
    approved: boolean;
    likes: number;
    replies?: HcbComment[];
}

async function getHcbComments(file: File): Promise<HcbComments> {
    const arrayBuf = await file.arrayBuffer();
    const comments = new TextDecoder().decode(arrayBuf);
    return JSON.parse(comments);
}

export async function importComments(db: Database, sessionToken: string, host: string, method: "ayano" | "hcb" | "file", url?: string, file?: File) {
    switch (method) {
        case "ayano": {
            if (!url) throw new Error('url is required');
            const cmts = await getAyanoComments(url);
            const comments = cmts.filter(c => !c.Reply).map(c => ({...c, id: genId(6)}));
            const replies = cmts.filter(c => !!c.Reply).map(c => ({...c, id: genId(6)}));

            const convertedComments: Comment[] = comments.map<Comment>(c => {
                console.log(c);
                if (!c) return ({})
                return ({
                    id: c.id,
                    author: c.Name,
                    content: c.Text,
                    website: c.Website,
                    createdAt: convertTimestamp(c.Timestamp),
                    address: '0.0.0.0 (imported)',
                    host: host,
                    pagePath: c.Page,
                    approved: c.Moderated || true,
                    moderatedBy: c.Moderated ? 'Imported comment' : null,
                    parentId: null
                })
            }) 

            const convertedReplies: Comment[] = replies.map<Comment>(c => {
                const parent = comments.find(cm => c.Reply === `${cm.Name}|--|${cm.Timestamp2}`)
                console.log(parent)
                return ({
                    id: c.id,
                    author: c.Name,
                    content: c.Text,
                    website: c.Website,
                    createdAt: convertTimestamp(c.Timestamp),
                    address: '0.0.0.0 (imported)',
                    host: host,
                    pagePath: c.Page,
                    approved: c.Moderated || true,
                    moderatedBy: c.Moderated ? 'Imported comment' : null,
                    parentId: parent.id
                })
            }) 

            const converted = [
                ...convertedComments,
                ...convertedReplies
            ].sort((a, b) => {
                //@ts-ignore
                return b.createdAt - a.createdAt
            })

            await db.importComments(sessionToken, host, converted);
        }
    }
}