import Image from 'next/image';
import { useRouter } from 'next/router';
import { MDXRemote } from 'next-mdx-remote';
import { Button } from '~/components';
import { Blog, Pill } from '~/components';
import { getPost, getAllPostSlugs, getAllPosts } from '~/lib/post';
import { Layout } from '~/layouts';
import type { GetStaticPaths, GetStaticProps } from 'next';
import type { ParsedUrlQuery } from 'querystring';
import type { Post } from '~/types';
import ConfettiExplosion from 'react-confetti-explosion';
import { useState } from 'react';
import { useEffectOnce } from 'react-use';
import axios from 'axios';

interface PathProps extends ParsedUrlQuery {
	slug: string;
}

interface PostMeta {
	slug: string;
	title: string;
}

interface BlogPostProps {
	post: Post;
	previousPost: PostMeta | null;
	nextPost: PostMeta | null;
}

const truncate = (str: string) =>
	str.length > 20 ? str.slice(0, 20).trimEnd() + '…' : str;

export const getStaticPaths: GetStaticPaths<PathProps> = async () => {
	const posts = await getAllPostSlugs();
	return {
		paths: posts.map((post) => ({
			params: {
				slug: post.replace(/\.md/, ''),
			},
		})),
		fallback: false,
	};
};

export const getStaticProps: GetStaticProps<BlogPostProps, PathProps> = async ({ params }) => {
	const { frontmatter, source } = await getPost(params.slug);

	const allPosts = await getAllPosts();
	const sorted = allPosts.sort(
		(a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime(),
	);

	const currentIndex = sorted.findIndex((p) => p.frontmatter.slug === params.slug);

	const previousPost =
		currentIndex > 0
			? {
					slug: sorted[currentIndex - 1].frontmatter.slug,
					title: sorted[currentIndex - 1].frontmatter.title,
			  }
			: null;

	const nextPost =
		currentIndex < sorted.length - 1
			? {
					slug: sorted[currentIndex + 1].frontmatter.slug,
					title: sorted[currentIndex + 1].frontmatter.title,
			  }
			: null;

	return {
		props: {
			post: {
				frontmatter,
				source,
			},
			previousPost,
			nextPost,
		},
	};
};

export default function BlogPost({ post, previousPost, nextPost }: BlogPostProps) {
	const router = useRouter();
	const [views, setViews] = useState<number>(0);
	const [likes, setLikes] = useState<number>(0);
	const [comments, setComments] = useState<string[]>([]);
	const [value, setValue] = useState('');
	const [name, setName] = useState('');
	const [isExploding, setIsExploding] = useState(false);
	const [updated, setUpdated] = useState(false);

	const formatter = new Intl.NumberFormat('en-US', {
		notation: "compact",
		compactDisplay: "short",
		maximumFractionDigits: 2
	});

	const updateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.value.length > 1) {
			if (e.target.value[e.target.value.length - 1] === ' ') {
				if (e.target.value[e.target.value.length - 2] === ' ') return;
			}
		}
		setValue(e.target.value);
	};

	const updateChangeX = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.value.length > 60) return;
		if (e.target.value.length > 1) {
			if (e.target.value[e.target.value.length - 1] === ' ') {
				if (e.target.value[e.target.value.length - 2] === ' ') return;
			}
		}
		setName(e.target.value);
	};

	const fetchLikes = async () => {
		const res = await axios.get(
			`${process.env.NEXT_PUBLIC_FETCH_URL}/api?title=${post.frontmatter.slug}`,
		);
		setViews(Number(res.data.views));
		setLikes(Number(res.data.likes));
		setComments(res.data.comments ?? []);
	};

	const updateLikes = async () => {
		setIsExploding(true);
		if (updated) return;
		setLikes((prev) => prev + 1);
		setUpdated(true);
		await axios.post(`${process.env.NEXT_PUBLIC_FETCH_URL}/api`, {
			title: post.frontmatter.slug,
		});
	};

	const postComments = async () => {
		if (value === '' || value === ' ') return;
		setName('');
		setValue('');
		await axios.post(`${process.env.NEXT_PUBLIC_FETCH_URL}/api/comment`, {
			title: post.frontmatter.slug,
			comment: value + '*' + name,
		});
		setComments((prev) => [...prev, value + '*' + name]);
	};

	useEffectOnce(() => {
		fetchLikes();
	});

	return (
		<>
			<Layout.Blog
				seo={{
					title: `sambhavsaxena ─ blog ─ ${post.frontmatter.title}`,
					description: post.frontmatter.description ?? undefined,
					openGraph: {
						title: post.frontmatter.title,
						images: [
							{
								url: post.frontmatter.banner ?? '/banner.png',
								alt: post.frontmatter.description,
								width: 1280,
								height: 720,
							},
						],
					},
				}}>
				<div className="relative px-4 py-16 overflow-hidden">
					<div className="relative px-4 sm:px-6 lg:px-8">
						{post.frontmatter.banner && (post.frontmatter.banner_show ?? true) && (
							<div className="relative sm:max-w-2xl lg:sm:max-w-6xl mx-auto my-2 sm:my-4">
								<div className="w-full h-full lg:h-96 mb-8 bg-gray-200 dark:bg-gray-600 rounded-3xl motion-safe:animate-pulse" />
								<Image
									alt={post.frontmatter.banner_alt ?? post.frontmatter.title}
									className="absolute top-0 left-0 w-full h-auto max-h-64 lg:max-h-96 mb-8 rounded-3xl object-cover select-none shadow-xl default-transition"
									draggable={false}
									layout="fill"
									src={post.frontmatter.banner}
								/>
							</div>
						)}
						<div className="flex flex-col space-y-4 max-w-prose mx-auto my-4 text-lg text-center">
							<div>
								{post.frontmatter.context && (
									<span className="block text-primary-600 font-semibold tracking-wide uppercase text-base text-center">
										{post.frontmatter.context}
									</span>
								)}
								<span className="text-gray-900 dark:text-white sm:text-4xl text-3xl text-center leading-8 font-extrabold tracking-tight">
									{post.frontmatter.title}
								</span>
							</div>

							<span className="flex justify-center items-center">
								<Pill.Date>{post.frontmatter.date}</Pill.Date>
							</span>
							{post.frontmatter.description && post.frontmatter.description_show && (
								<p className="mt-8 text-xl text-gray-400 leading-8">
									{post.frontmatter.description}
								</p>
							)}
						</div>
						<article className="max-w-prose prose prose-primary prose-lg text-gray-500 mx-auto">
							<MDXRemote {...post.source} components={Blog.X} />
						</article>
						<div className="flex flex-col space-y-4 max-w-prose mx-auto my-4 text-lg text-center">
							<span className="flex justify-center items-center">
								<div className="mx-10" aria-disabled>
									<Pill.Eye>{formatter.format(views)}</Pill.Eye>
								</div>
								<div
									className="mx-10"
									onClick={updateLikes}
									style={
										updated ? { cursor: 'not-allowed' } : { cursor: 'pointer' }
									}
									aria-disabled>
									{isExploding && (
										<ConfettiExplosion
											force={0.2}
											duration={3000}
											particleCount={15}
											width={400}
										/>
									)}
									<Pill.Likes>{formatter.format(likes)}</Pill.Likes>
								</div>
							</span>
							<hr />
							<div className="flex justify-between items-center gap-4 pt-2 pb-4">
								{previousPost ? (
									<button
										onClick={() => router.push(`/blog/${previousPost.slug}`)}
										className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-gray-800 transition-all duration-200 group">
										<span className="text-orange-400 group-hover:text-orange-500 transition-colors">
											←
										</span>
										<span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors font-medium">
											{truncate(previousPost.title)}
										</span>
									</button>
								) : (
									<div />
								)}
								{nextPost ? (
									<button
										onClick={() => router.push(`/blog/${nextPost.slug}`)}
										className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-gray-800 transition-all duration-200 group">
										<span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors font-medium">
											{truncate(nextPost.title)}
										</span>
										<span className="text-orange-400 group-hover:text-orange-500 transition-colors">
											→
										</span>
									</button>
								) : (
									<div />
								)}
							</div>
							<hr />
						</div>
						<div className="max-w-prose prose prose-primary prose-sm text-gray-500 mx-auto">
							<div className="btn text-center flex flex-col">
								<div className="text-orange-500 text-center my-2">
									Write your comments below
								</div>
								<input
									className="rounded-md text-center dark:text-gray-200 text-base p-2 my-1 bg-white dark:bg-gray-900 border-1 dark:border-gray-500 hover:border-orange-500 focus:border-orange-500 focus:outline-none"
									placeholder="yo what do you think about it?"
									onChange={updateChange}
									value={value}
									maxLength={100}
								/>
								<input
									className="rounded-md text-center dark:text-gray-200 text-base p-2 my-1 bg-white dark:bg-gray-900 border-1 dark:border-gray-500 hover:border-orange-500 focus:border-orange-500 focus:outline-none"
									placeholder="and what's your name?"
									onChange={updateChangeX}
									value={name}
									maxLength={20}
								/>
								<div className="text-center my-1">
									{value === '' ||
									value === ' ' ||
									name === '' ||
									name === ' ' ? (
										<></>
									) : (
										<Button.Icon
											onClick={postComments}
											className="hover:bg-orange-100">
											<div className="w-60 text-orange-500">Post</div>
										</Button.Icon>
									)}
								</div>
							</div>
							<div className="flex flex-col mx-auto my-4 text-sm overflow-hidden">
								<div className="text-orange-500 text-center my-5">
									<u>Recent comments</u>
								</div>
								{comments.length === 0 ? (
									<div className="text-center">No comments yet</div>
								) : (
									comments.map((comment, i) => (
										<div className="flex flex-row" key={i}>
											<div className="text-orange-500 m-2">&rarr;</div>
											<div className="text-gray500 dark:text-gray-300 my-2">
												{comment.split('*')[0]}{' '}
												<span className="text-gray-400">
													- {comment.split('*')[1]}
												</span>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</div>
			</Layout.Blog>
			<Blog.Styles.Code />
			<Blog.Styles.Elements />
		</>
	);
}
