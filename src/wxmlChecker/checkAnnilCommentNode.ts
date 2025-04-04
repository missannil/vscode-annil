// import type { Comment } from "domhandler";
// import * as vscode from "vscode";
// import type { CheckContext } from ".";
// import { DiagnosticErrorType } from "../diagnosticFixProvider/errorType";
// import { generateDiagnostic } from "./tools/generateDiagnostic";

// export type CommentType = "line" | "start" | "end" | "all" | "repeatTag";

// export type CommentStatus = Exclude<CommentType, "end"> | "none";

// export type CommentText = `annil disable ${CommentType}`;

// export enum COMMENT_TEXT_LIST {
// 	全局关闭检查 = "annil disable all",
// 	关闭下一行检查 = "annil disable line",
// 	关闭检查开始 = "annil disable start",
// 	关闭检查结束 = "annil disable end",
// 	关闭重复组件检查 = "annil disable repeatTag",
// }

// // 有效的注释内容
// function isValidCommentText(commentText: string): boolean {
// 	return Object.values(COMMENT_TEXT_LIST).includes(commentText as COMMENT_TEXT_LIST);
// }

// // 非头部位置的全局注释报错
// function isInvalidGlobalCommentLocation(
// 	isHead: boolean,
// 	commentType: CommentType,
// ): boolean {
// 	return isHead === false && commentType === "all";
// }

// // 重复的注释
// function isRepeatedComment(preCommentStatus: CommentStatus, curCommentText: CommentType): boolean {
// 	const startOrLine = ["start", "line"];

// 	return (startOrLine.includes(preCommentStatus) && startOrLine.includes(curCommentText))
// 		|| (preCommentStatus === "repeatTag" && curCommentText === "repeatTag");
// }

// // end注释是否有效 报错
// function isEndCommentWithoutStart(preCommentStatus: CommentStatus, commentType: CommentType): boolean {
// 	return preCommentStatus !== "start" && commentType === "end";
// }

// const commentContent = ["line", "start", "end", "all", "repeatTag"] as const satisfies CommentType[];

// export function getCommentType(childNode: Comment): CommentType {
// 	const commentText = childNode.data.trim();
// 	for (const commentType of commentContent) {
// 		if (commentText.includes(commentType)) {
// 			return commentType;
// 		}
// 	}
// 	throw new Error(`注释类型错误:${commentText}`,);
// }

// function validateCommentText(
// 	curCommentText: string,
// 	diagnosticList: vscode.Diagnostic[],
// 	textlines: string[],
// 	startLine: number,
// ): boolean {
// 	if (!isValidCommentText(curCommentText)) {
// 		diagnosticList.push(
// 			generateDiagnostic(
// 				[new RegExp(curCommentText)],
// 				DiagnosticErrorType.commentTextError,
// 				textlines,
// 				startLine,
// 			),
// 		);

// 		return false;
// 	}

// 	return true;
// }

// function validateCommentType(
// 	preCommentStatus: CommentStatus,
// 	curCommentType: CommentType,
// 	curCommentText: string,
// 	isHead: boolean,
// 	diagnosticList: vscode.Diagnostic[],
// 	textlines: string[],
// 	startLine: number,
// ): boolean {
// 	if (isRepeatedComment(preCommentStatus, curCommentType)) {
// 		diagnosticList.push(
// 			generateDiagnostic(
// 				[new RegExp(curCommentText)],
// 				DiagnosticErrorType.repeatedComment,
// 				textlines,
// 				startLine,
// 			),
// 		);

// 		return false;
// 	}
// 	if (isInvalidGlobalCommentLocation(isHead, curCommentType)) {
// 		diagnosticList.push(
// 			generateDiagnostic(
// 				[new RegExp(curCommentText)],
// 				DiagnosticErrorType.invalidCommentLocation,
// 				textlines,
// 				startLine,
// 			),
// 		);

// 		return false;
// 	}
// 	if (isEndCommentWithoutStart(preCommentStatus, curCommentType)) {
// 		diagnosticList.push(
// 			generateDiagnostic(
// 				[new RegExp(curCommentText)],
// 				DiagnosticErrorType.noStartedComment,
// 				textlines,
// 				startLine,
// 			),
// 		);

// 		return false;
// 	}

// 	return true;
// }

// /**
//  * 对注释进行检查 返回注释类型或null(诊断出错误时)
//  * @param childNode 注释节点
//  * @param textlines 文件文本行
//  * @param isHead 当前注释是否为文件头部注释
//  */
// export function checkAnnilCommentNode(
// 	childNode: Comment,
// 	startLine: number,
// 	checkContext: CheckContext,
// ): CommentType | null {
// 	const { preCommentStatus, diagnosticList, textlines, isHeadLocation: isHead } = checkContext;
// 	if (preCommentStatus === "all") return null;
// 	const curCommentText = childNode.data.trim();
// 	if (!validateCommentText(curCommentText, diagnosticList, textlines, startLine)) return null;
// 	const curCommentType = getCommentType(childNode);
// 	if (!validateCommentType(preCommentStatus, curCommentType, curCommentText, isHead, diagnosticList, textlines, startLine)) return null;

// 	return curCommentType;
// }
