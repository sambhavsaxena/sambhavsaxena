import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote';
import { Blog, Pill } from '~/components';
import { getPost, getAllPostSlugs } from '~/lib/post';
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

interface BlogPostProps {
	post: Post;
}

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

	return {
		props: {
			post: {
				frontmatter,
				source,
			},
		},
	};
};

export default function BlogPost({ post }: BlogPostProps) {
	const [likes, setLikes] = useState('...');
	const [isExploding, setIsExploding] = useState(false);
	const [updated, setUpdated] = useState(false);
	const fetchLikes = async () => {
		const res = await axios.get(
			`https://likescount.onrender.com/api?title=${post.frontmatter.slug}`,
		);
		setLikes(res.data.likes);
	};
	const updateLikes = async () => {
		setIsExploding(true);
		if (updated) return;
		else {
			setLikes((prev) => prev + 1);
			setUpdated(true);
			await axios.post(`https://likescount.onrender.com/api`, {
				title: post.frontmatter.slug,
			});
		}
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
								{post.frontmatter.title_prefix && (
									<span className="block text-primary-600 font-semibold tracking-wide uppercase text-base text-center">
										{post.frontmatter.title_prefix}
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
								{isExploding && (
									<ConfettiExplosion
										force={0.2}
										duration={3000}
										particleCount={15}
										width={400}
									/>
								)}
								<div
									onClick={updateLikes}
									style={
										updated ? { cursor: 'not-allowed' } : { cursor: 'pointer' }
									}
									aria-disabled>
									<Pill.Likes>{likes}</Pill.Likes>
								</div>
							</span>
						</div>
					</div>
				</div>
			</Layout.Blog>
			<Blog.Styles.Code />
			<Blog.Styles.Elements />
		</>
	);
}
