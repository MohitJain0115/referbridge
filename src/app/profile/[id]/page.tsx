
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, firebaseReady, auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, GraduationCap, User, DollarSign, Building2, Link as LinkIcon, ArrowLeft, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from "date-fns";
import type { Candidate } from '@/lib/types';

type ProfileData = {
    name: string;
    profilePic: string;
    currentRole: string;
    targetRole: string;
    about: string;
    experiences: any[];
    educations: any[];
    companies: any[];
    expectedSalary: number;
    isSalaryVisible: boolean;
    skills: string[];
    status: Candidate['status'];
};

function ProfilePageSkeleton() {
    return (
        <div className="bg-secondary min-h-screen p-4 md:p-10">
            <div className="max-w-4xl mx-auto">
                <Skeleton className="h-10 w-48 mb-8" />
                <Card>
                    <CardHeader className="text-center items-center border-b pb-6">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <Skeleton className="h-8 w-48 mt-4" />
                        <Skeleton className="h-6 w-32 mt-2" />
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                        <div className="space-y-4">
                            <Skeleton className="h-7 w-1/3" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-7 w-1/3" />
                            <Skeleton className="h-40 w-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-7 w-1/3" />
                            <Skeleton className="h-40 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

    useEffect(() => {
        if (!firebaseReady) return;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!firebaseReady || !userId) return;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const profileDocRef = doc(db, 'profiles', userId);
                const profileDoc = await getDoc(profileDocRef);

                if (profileDoc.exists()) {
                    const data = profileDoc.data();
                    
                    if (currentUser && currentUser.uid !== userId && data.status === 'Pending') {
                        await updateDoc(profileDocRef, { status: 'Viewed' });
                        data.status = 'Viewed'; 
                    }
                    
                    const experiences = data.experiences?.map((exp: any) => ({ ...exp, from: exp.from?.toDate(), to: exp.to?.toDate() })) || [];
                    const educations = data.educations?.map((edu: any) => ({ ...edu, from: edu.from?.toDate(), to: edu.to?.toDate() })) || [];
                    
                    const profileData = {
                        ...data,
                        isSalaryVisible: data.isSalaryVisible === false ? false : true,
                        experiences,
                        educations,
                        skills: data.skills || []
                    } as ProfileData;

                    setProfile(profileData);
                } else {
                    setError('Profile not found.');
                }
            } catch (err: any) {
                console.error('Error fetching profile:', err);
                setError('Failed to load profile. Please check your network and Firestore rules.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId, currentUser]);

    if (loading) {
        return <ProfilePageSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-secondary">
                <Card className="p-8 text-center">
                    <CardTitle className="text-destructive">Error</CardTitle>
                    <CardDescription className="mt-2">{error}</CardDescription>
                    <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                </Card>
            </div>
        );
    }
    
    if (!profile) return null;

    return (
        <div className="bg-secondary min-h-screen p-4 md:p-10">
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
                <Card>
                    <CardHeader className="text-center items-center border-b pb-6">
                        {profile.profilePic && (
                            <Image
                                src={profile.profilePic}
                                alt={`${profile.name}'s profile picture`}
                                width={128}
                                height={128}
                                className="rounded-full object-cover aspect-square border-4 border-primary/20 shadow-md"
                                data-ai-hint="person avatar"
                            />
                        )}
                        <CardTitle className="font-headline text-3xl mt-4">{profile.name}</CardTitle>
                        <CardDescription className="text-lg">{profile.currentRole}</CardDescription>
                         {profile.targetRole && (
                            <p className="text-sm text-muted-foreground">Seeking: {profile.targetRole}</p>
                         )}
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                        {profile.isSalaryVisible && profile.expectedSalary > 0 && (
                             <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
                                <DollarSign className="h-5 w-5" />
                                <span>{profile.expectedSalary.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })} expected salary</span>
                            </div>
                        )}

                        {profile.about && (
                            <div>
                                <h3 className="flex items-center gap-2 font-headline text-xl mb-4"><User className="h-5 w-5 text-primary" /> About Me</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{profile.about}</p>
                            </div>
                        )}
                        
                        {profile.skills && profile.skills.length > 0 && (
                            <div>
                                <h3 className="flex items-center gap-2 font-headline text-xl mb-4"><Sparkles className="h-5 w-5 text-primary" /> Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map(skill => (
                                        <Badge key={skill} variant="secondary" className="text-sm">{skill}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {profile.experiences && profile.experiences.length > 0 && (
                            <div>
                                <h3 className="flex items-center gap-2 font-headline text-xl mb-4"><Briefcase className="h-5 w-5 text-primary" /> Work Experience</h3>
                                <div className="space-y-6">
                                    {profile.experiences.map((exp: any, index: number) => (
                                        <div key={index} className="pl-6 relative before:absolute before:left-0 before:top-2 before:h-full before:w-0.5 before:bg-border last:before:hidden">
                                            <div className="absolute left-[-5.5px] top-1.5 h-3 w-3 rounded-full bg-primary" />
                                            <p className="font-semibold text-lg">{exp.role}</p>
                                            <p className="text-muted-foreground">{exp.company}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {exp.from ? format(exp.from, 'MMM yyyy') : ''} - {exp.currentlyWorking ? 'Present' : exp.to ? format(exp.to, 'MMM yyyy') : ''}
                                            </p>
                                            <p className="mt-2 text-foreground/80 whitespace-pre-wrap">{exp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {profile.educations && profile.educations.length > 0 && (
                             <div>
                                <h3 className="flex items-center gap-2 font-headline text-xl mb-4"><GraduationCap className="h-5 w-5 text-primary" /> Education</h3>
                                <div className="space-y-6">
                                    {profile.educations.map((edu: any, index: number) => (
                                        <div key={index} className="pl-6 relative before:absolute before:left-0 before:top-2 before:h-full before:w-0.5 before:bg-border last:before:hidden">
                                            <div className="absolute left-[-5.5px] top-1.5 h-3 w-3 rounded-full bg-primary" />
                                            <p className="font-semibold text-lg">{edu.degree}</p>
                                            <p className="text-muted-foreground">{edu.institution}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {edu.from ? format(edu.from, 'MMM yyyy') : ''} - {edu.to ? format(edu.to, 'MMM yyyy') : ''}
                                            </p>
                                            <p className="mt-2 text-foreground/80 whitespace-pre-wrap">{edu.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {profile.companies && profile.companies.length > 0 && (
                             <div>
                                <h3 className="flex items-center gap-2 font-headline text-xl mb-4"><Building2 className="h-5 w-5 text-primary" /> Target Companies & Jobs</h3>
                                <div className="space-y-4">
                                    {profile.companies.map((company: any, index: number) => (
                                        <Card key={index} className="p-4 bg-muted/50">
                                            <p className="font-semibold">{company.name}</p>
                                            {company.jobs && company.jobs.length > 0 && (
                                                <ul className="mt-2 space-y-1 list-none">
                                                    {company.jobs.map((job: any, jIndex: number) => (
                                                        job.url && (
                                                            <li key={jIndex} className="flex items-center gap-2 text-sm">
                                                                <LinkIcon className="h-3.5 w-3.5 text-primary/80"/>
                                                                <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{job.url}</a>
                                                            </li>
                                                        )
                                                    ))}
                                                </ul>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
