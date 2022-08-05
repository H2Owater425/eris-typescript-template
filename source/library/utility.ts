import { ClientRequest, IncomingMessage } from 'http';
import { request } from 'https';
import { RejectFunction, ResolveFunction, Response } from '@library/type';
import { EmbedField, EmbedOptions } from 'eris';
import { client } from '@application';

export function fetchResponse(url: string, options: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> } = {}): Promise<Response> {
	return new Promise<Response>(function (resolve: ResolveFunction<Response>, reject: RejectFunction): void {
		const _url: URL = new URL(url);

		const clientRequest: ClientRequest = request({
			hostname: _url['hostname'],
			path: _url['pathname'] + _url['search'],
			method: options['method'],
			port: 443,
			headers: options['headers']
		}, function (incomingMessage: IncomingMessage): void {
			const buffers: Buffer[] = [];
			let bufferLength: number = 0;

			if(incomingMessage['statusCode'] === 200) {
				incomingMessage.on('data', function (chunk: any): void {
					buffers.push(chunk);
					bufferLength += chunk['byteLength'];

					return;
				})
				.on('error', reject)
				.on('end', function (): void {
					resolve({
						buffer: Buffer.concat(buffers, bufferLength),
						header: incomingMessage['headers']
					});

					return;
				});
			} else {
				reject(new Error('Invalid response status code'));
			}

			return;
		});

		if(typeof(options['body']) !== 'undefined') {
			clientRequest.write(options['body']);
		}

		clientRequest.end();

		return;
	});
}

export function getStringBetween(target: string, options: {
	starting?: string;
	ending?: string;
} = {}): string {
	const startingIndex: number = typeof(options['starting']) === 'string' ? target.indexOf(options['starting']) + options['starting']['length'] : 0;
	const endingIndex: number = typeof(options['ending']) === 'string' ? target.indexOf(options['ending']) : target['length'] - 1;

	return target.slice(startingIndex !== -1 ? startingIndex : 0, endingIndex !== -1 ? endingIndex : target['length'] - 1);
}

export function getHelpEmbed(index: number, pageSize: number): EmbedOptions {
	const helpEmbed: EmbedOptions = {
		color: Number.parseInt(process['env']['EMBED_COLOR'], 16),
		thumbnail: { url: 'https://cdn.h2owr.xyz/images/<bot>/logo.png' },
		title: '<Bot> | 도움',
		description: '',
		footer: { text: (index + 1) + '/' + Math.ceil(client['commandLabels']['length'] / pageSize) },
		fields: []
	};

	index *= pageSize;

	while((helpEmbed['fields'] as EmbedField[])['length'] !== pageSize && typeof(client['commands'][client['commandLabels'][index]]) === 'object') {
		(helpEmbed['fields'] as EmbedField[]).push({
			name: '`' + process['env']['PREFIX'] + client['commandLabels'][index] + '`',
			value: client['commands'][client['commandLabels'][index]]['description']
		});

		index++;
	}

	(helpEmbed['fields'] as EmbedField[]).push({
		name: '\u200b',
		value: '*`' + process['env']['PREFIX'] + '!도움 ~<명령어>`를 통해 더 많은 정보를 확인하세요*'
	});

	return helpEmbed;
}