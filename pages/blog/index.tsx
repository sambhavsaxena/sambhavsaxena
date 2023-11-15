import { Blog } from '~/components';
import { getAllPostsFrontMatter } from '~/lib/post';
import { Layout } from '~/layouts';
import type { GetStaticProps } from 'next';
import type { FrontMatter } from '~/types';
import { Button } from '~/components';
import { useState } from 'react';

interface BlogProps {
	serialisedFrontmatters: string;
}

export const getStaticProps: GetStaticProps<BlogProps> = async () => {
	const frontmatters = await getAllPostsFrontMatter();
	return {
		props: {
			serialisedFrontmatters: JSON.stringify(frontmatters),
		},
	};
};

export default function BlogPage({ serialisedFrontmatters }: BlogProps) {
	const frontmatters = JSON.parse(serialisedFrontmatters) as Array<FrontMatter>;
	const [category, setCategory] = useState('All');
	if (frontmatters.length <= 0) return <Blog.Error routeBlog={false} />;
	const toggleSelection = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
		e.preventDefault();
		setCategory(e.currentTarget.innerText.split('(')[0].trim());
	};
	return (
		<Layout.Default seo={{ title: 'sambhavsaxena ─ blog' }}>
			<div className="mt-8 sm:mt-16 mb-20 mx-0 sm:mx-6 lg:mb-28 lg:mx-8">
				<div className="relative max-w-6xl mx-auto">
					<div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-4 space-y-4 sm:space-y-0 w-full mt-8 sm:mt-4">
						<Button.Outline href="" onClick={toggleSelection}>
							All ({frontmatters.length})
						</Button.Outline>
						<Button.Outline href="" onClick={toggleSelection}>
							Technology (
							{
								frontmatters.filter(
									(frontmatter) => frontmatter.context === 'Technology',
								).length
							}
							)
						</Button.Outline>
						<Button.Outline href="" onClick={toggleSelection}>
							Philosophy (
							{
								frontmatters.filter(
									(frontmatter) => frontmatter.context === 'Philosophy',
								).length
							}
							)
						</Button.Outline>
						<Button.Outline href="" onClick={toggleSelection}>
							Travel (
							{
								frontmatters.filter(
									(frontmatter) => frontmatter.context === 'Travel',
								).length
							}
							)
						</Button.Outline>
						<Button.Outline href="" onClick={toggleSelection}>
							Stargazing (
							{
								frontmatters.filter(
									(frontmatter) => frontmatter.context === 'Stargazing',
								).length
							}
							)
						</Button.Outline>
					</div>
					<div className="mt-4 lg:mt-12 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:max-w-none">
						{category === 'All'
							? frontmatters.map((frontmatter, i) => (
									<Blog.Post key={i} frontmatter={frontmatter} index={i} />
							  ))
							: frontmatters
									.filter((frontmatter) => frontmatter.context === category)
									.map((frontmatter, i) => (
										<Blog.Post key={i} frontmatter={frontmatter} index={i} />
									))}
					</div>
				</div>
			</div>
		</Layout.Default>
	);
}
